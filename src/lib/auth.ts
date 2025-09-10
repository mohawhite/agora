import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { setSession, getSession, deleteSession } from './redis'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken(userId)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const expiresInSeconds = 7 * 24 * 60 * 60 // 7 days in seconds

  // Store in PostgreSQL
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  // Store in Redis for fast access
  await setSession(token, userId, expiresInSeconds)

  return token
}

export async function validateSession(token: string): Promise<{ userId: string } | null> {
  try {
    // Check Redis first for performance
    const cachedUserId = await getSession(token)
    if (cachedUserId) {
      return { userId: cachedUserId }
    }

    // Fallback to PostgreSQL
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
        await deleteSession(token) // Clean Redis too
      }
      return null
    }

    // Re-cache in Redis for next time
    const remainingTime = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    if (remainingTime > 0) {
      await setSession(token, session.userId, remainingTime)
    }

    return { userId: session.userId }
  } catch {
    return null
  }
}

export async function destroySession(token: string): Promise<void> {
  try {
    // Delete from both PostgreSQL and Redis
    await prisma.session.delete({
      where: { token },
    })
    await deleteSession(token)
  } catch {
    // Session might not exist
  }
}
import mongoose from 'mongoose'
import logger from './logger'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agora'

interface MongoConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseConnection: MongoConnection | undefined
}

let cached = global.mongooseConnection

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null }
}

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    logger.debug('Using existing MongoDB connection')
    return cached!.conn
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.info('MongoDB connected successfully')
      return mongoose
    }).catch((error) => {
      logger.error('MongoDB connection error:', error)
      throw error
    })
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    throw e
  }

  return cached!.conn
}

// Event listeners
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected')
})

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  logger.info('MongoDB connection closed through app termination')
  process.exit(0)
})

export default mongoose
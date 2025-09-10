import { NextRequest, NextResponse } from 'next/server'
import { connectRedis } from '@/lib/redis'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    await connectRedis()
    
    logger.info('Redis connection test successful')
    
    return NextResponse.json({
      success: true,
      message: 'Redis connected successfully'
    })
  } catch (error) {
    logger.error('Redis connection test failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Redis',
        details: error.message
      },
      { status: 500 }
    )
  }
}
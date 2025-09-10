import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAnalytics extends Document {
  date: Date
  type: 'daily' | 'weekly' | 'monthly'
  metrics: {
    totalUsers: number
    totalMairies: number
    totalReservations: number
    totalRevenue: number
    newUsers: number
    activeUsers: number
    reservationsByStatus: {
      pending: number
      confirmed: number
      cancelled: number
      completed: number
    }
    topCities: Array<{ city: string; count: number }>
    averageReservationValue: number
  }
  createdAt: Date
  updatedAt: Date
}

const AnalyticsSchema = new Schema<IAnalytics>({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly'],
    index: true
  },
  metrics: {
    totalUsers: { type: Number, default: 0 },
    totalMairies: { type: Number, default: 0 },
    totalReservations: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    reservationsByStatus: {
      pending: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      completed: { type: Number, default: 0 }
    },
    topCities: [{
      city: String,
      count: Number
    }],
    averageReservationValue: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'analytics'
})

// Index unique sur date + type
AnalyticsSchema.index({ date: 1, type: 1 }, { unique: true })

export const Analytics: Model<IAnalytics> = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema)
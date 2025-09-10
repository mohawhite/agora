import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IActivity extends Document {
  userId: string
  type: 'LOGIN' | 'LOGOUT' | 'RESERVATION_CREATE' | 'RESERVATION_UPDATE' | 'PAYMENT' | 'PROFILE_UPDATE'
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['LOGIN', 'LOGOUT', 'RESERVATION_CREATE', 'RESERVATION_UPDATE', 'PAYMENT', 'PROFILE_UPDATE']
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  collection: 'activities'
})

// Index pour les requêtes fréquentes
ActivitySchema.index({ userId: 1, createdAt: -1 })
ActivitySchema.index({ type: 1, createdAt: -1 })

export const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
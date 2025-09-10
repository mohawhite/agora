import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const registerSchema = z.object({
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(1, 'Confirmation du mot de passe requise'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'MAIRIE']).default('USER'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const mairieSchema = z.object({
  name: z.string().min(1, 'Nom de la mairie requis'),
  address: z.string().min(1, 'Adresse requise'),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().min(5, 'Code postal invalide').max(5, 'Code postal invalide'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  siret: z.string().optional(),
})

export const salleSchema = z.object({
  name: z.string().min(1, 'Nom de la salle requis'),
  description: z.string().optional(),
  capacity: z.number().min(1, 'Capacité minimale de 1 personne'),
  surface: z.number().min(1, 'Surface minimale de 1m²').optional(),
  price: z.number().min(0, 'Le prix ne peut pas être négatif'),
  address: z.string().min(1, 'Adresse requise'),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().min(5, 'Code postal invalide').max(5, 'Code postal invalide'),
  amenities: z.array(z.string()).default([]),
  available: z.boolean().default(true),
})

export const reservationSchema = z.object({
  startDate: z.string().datetime('Date de début invalide'),
  endDate: z.string().datetime('Date de fin invalide'),
  message: z.string().optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['endDate'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type MairieInput = z.infer<typeof mairieSchema>
export type SalleInput = z.infer<typeof salleSchema>
export type ReservationInput = z.infer<typeof reservationSchema>
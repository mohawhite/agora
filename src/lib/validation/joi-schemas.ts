import Joi from 'joi'

// User validation schemas
export const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
    'any.required': 'Le prénom est requis'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 50 caractères',
    'any.required': 'Le nom est requis'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'L\'email est requis'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
    'any.required': 'Le mot de passe est requis'
  }),
  phone: Joi.string().pattern(/^(\+33|0)[1-9](?:[0-9]{8})$/).optional().messages({
    'string.pattern.base': 'Numéro de téléphone français invalide'
  }),
  role: Joi.string().valid('USER', 'MAIRIE').default('USER')
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'L\'email est requis'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Le mot de passe est requis'
  })
})

// Mairie validation schemas
export const mairieSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom de la mairie doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères',
    'any.required': 'Le nom de la mairie est requis'
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.min': 'L\'adresse doit contenir au moins 5 caractères',
    'string.max': 'L\'adresse ne peut pas dépasser 200 caractères',
    'any.required': 'L\'adresse est requise'
  }),
  city: Joi.string().min(2).max(100).required().messages({
    'string.min': 'La ville doit contenir au moins 2 caractères',
    'string.max': 'La ville ne peut pas dépasser 100 caractères',
    'any.required': 'La ville est requise'
  }),
  postalCode: Joi.string().pattern(/^[0-9]{5}$/).required().messages({
    'string.pattern.base': 'Code postal invalide (5 chiffres requis)',
    'any.required': 'Le code postal est requis'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'La description ne peut pas dépasser 1000 caractères'
  }),
  phone: Joi.string().pattern(/^(\+33|0)[1-9](?:[0-9]{8})$/).optional().messages({
    'string.pattern.base': 'Numéro de téléphone français invalide'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Email invalide'
  }),
  website: Joi.string().uri().optional().messages({
    'string.uri': 'URL du site web invalide'
  }),
  siret: Joi.string().pattern(/^[0-9]{14}$/).optional().messages({
    'string.pattern.base': 'Numéro SIRET invalide (14 chiffres requis)'
  })
})

// Salle validation schemas
export const salleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom de la salle doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères',
    'any.required': 'Le nom de la salle est requis'
  }),
  description: Joi.string().max(2000).optional().messages({
    'string.max': 'La description ne peut pas dépasser 2000 caractères'
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.min': 'L\'adresse doit contenir au moins 5 caractères',
    'string.max': 'L\'adresse ne peut pas dépasser 200 caractères',
    'any.required': 'L\'adresse est requise'
  }),
  city: Joi.string().min(2).max(100).required().messages({
    'string.min': 'La ville doit contenir au moins 2 caractères',
    'string.max': 'La ville ne peut pas dépasser 100 caractères',
    'any.required': 'La ville est requise'
  }),
  postalCode: Joi.string().pattern(/^[0-9]{5}$/).required().messages({
    'string.pattern.base': 'Code postal invalide (5 chiffres requis)',
    'any.required': 'Le code postal est requis'
  }),
  capacity: Joi.number().integer().min(1).max(10000).required().messages({
    'number.min': 'La capacité doit être d\'au moins 1 personne',
    'number.max': 'La capacité ne peut pas dépasser 10000 personnes',
    'any.required': 'La capacité est requise'
  }),
  price: Joi.number().min(0).max(10000).required().messages({
    'number.min': 'Le prix ne peut pas être négatif',
    'number.max': 'Le prix ne peut pas dépasser 10000€',
    'any.required': 'Le prix est requis'
  }),
  equipment: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  available: Joi.boolean().default(true)
})

// Reservation validation schemas
export const reservationSchema = Joi.object({
  startDate: Joi.date().min('now').required().messages({
    'date.min': 'La date de début doit être dans le futur',
    'any.required': 'La date de début est requise'
  }),
  endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
    'date.greater': 'La date de fin doit être postérieure à la date de début',
    'any.required': 'La date de fin est requise'
  }),
  message: Joi.string().max(500).optional().messages({
    'string.max': 'Le message ne peut pas dépasser 500 caractères'
  })
})

export const reservationUpdateSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED').required().messages({
    'any.only': 'Statut invalide',
    'any.required': 'Le statut est requis'
  }),
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'La raison ne peut pas dépasser 500 caractères'
  })
})

// Notification validation schemas
export const notificationSchema = Joi.object({
  title: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Le titre est requis',
    'string.max': 'Le titre ne peut pas dépasser 100 caractères',
    'any.required': 'Le titre est requis'
  }),
  message: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Le message est requis',
    'string.max': 'Le message ne peut pas dépasser 500 caractères',
    'any.required': 'Le message est requis'
  }),
  type: Joi.string().valid('RESERVATION', 'PAYMENT', 'SYSTEM').required().messages({
    'any.only': 'Type de notification invalide',
    'any.required': 'Le type est requis'
  }),
  relatedId: Joi.string().optional(),
  actionUrl: Joi.string().uri().optional().messages({
    'string.uri': 'URL d\'action invalide'
  })
})

// Generic validation helper
export function validateWithJoi<T>(schema: Joi.ObjectSchema, data: unknown): { value: T; error?: string } {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ')
    return { value: null as any, error: errorMessage }
  }

  return { value }
}
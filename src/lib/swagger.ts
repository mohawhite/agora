import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agora API',
      version: '1.0.0',
      description: 'API de la plateforme Agora pour la réservation de salles municipales',
      contact: {
        name: 'Agora Support',
        email: 'support@agora.fr'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Serveur de développement'
      },
      {
        url: 'https://agora-prod.vercel.app',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique de l\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur'
            },
            firstName: {
              type: 'string',
              description: 'Prénom de l\'utilisateur'
            },
            lastName: {
              type: 'string',
              description: 'Nom de famille de l\'utilisateur'
            },
            role: {
              type: 'string',
              enum: ['USER', 'MAIRIE', 'ADMIN'],
              description: 'Rôle de l\'utilisateur dans le système'
            },
            phone: {
              type: 'string',
              description: 'Numéro de téléphone'
            },
            isVerified: {
              type: 'boolean',
              description: 'Statut de vérification de l\'email'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Mairie: {
          type: 'object',
          required: ['id', 'name', 'address', 'userId'],
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique de la mairie'
            },
            name: {
              type: 'string',
              description: 'Nom de la mairie'
            },
            address: {
              type: 'string',
              description: 'Adresse de la mairie'
            },
            city: {
              type: 'string',
              description: 'Ville'
            },
            postalCode: {
              type: 'string',
              description: 'Code postal'
            },
            phone: {
              type: 'string',
              description: 'Numéro de téléphone'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de contact'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Site web'
            },
            description: {
              type: 'string',
              description: 'Description de la mairie'
            },
            userId: {
              type: 'string',
              description: 'ID de l\'utilisateur administrateur'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Salle: {
          type: 'object',
          required: ['id', 'name', 'capacity', 'pricePerHour', 'mairieId'],
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique de la salle'
            },
            name: {
              type: 'string',
              description: 'Nom de la salle'
            },
            description: {
              type: 'string',
              description: 'Description de la salle'
            },
            capacity: {
              type: 'integer',
              minimum: 1,
              description: 'Capacité d\'accueil'
            },
            area: {
              type: 'number',
              description: 'Superficie en m²'
            },
            pricePerHour: {
              type: 'number',
              description: 'Prix par heure en euros'
            },
            address: {
              type: 'string',
              description: 'Adresse de la salle'
            },
            city: {
              type: 'string',
              description: 'Ville'
            },
            postalCode: {
              type: 'string',
              description: 'Code postal'
            },
            latitude: {
              type: 'number',
              description: 'Latitude GPS'
            },
            longitude: {
              type: 'number',
              description: 'Longitude GPS'
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Liste des équipements disponibles'
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri'
              },
              description: 'URLs des images de la salle'
            },
            isActive: {
              type: 'boolean',
              description: 'Statut d\'activation de la salle'
            },
            mairieId: {
              type: 'string',
              description: 'ID de la mairie propriétaire'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Reservation: {
          type: 'object',
          required: ['id', 'startTime', 'endTime', 'totalPrice', 'userId', 'salleId'],
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique de la réservation'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Heure de début de la réservation'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: 'Heure de fin de la réservation'
            },
            totalPrice: {
              type: 'number',
              description: 'Prix total de la réservation'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'],
              description: 'Statut de la réservation'
            },
            notes: {
              type: 'string',
              description: 'Notes additionnelles'
            },
            userId: {
              type: 'string',
              description: 'ID de l\'utilisateur demandeur'
            },
            salleId: {
              type: 'string',
              description: 'ID de la salle réservée'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        FileUpload: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL d\'accès au fichier'
            },
            pathname: {
              type: 'string',
              description: 'Chemin du fichier'
            },
            contentType: {
              type: 'string',
              description: 'Type MIME du fichier'
            },
            size: {
              type: 'integer',
              description: 'Taille du fichier en bytes'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            code: {
              type: 'string',
              description: 'Code d\'erreur'
            },
            details: {
              type: 'object',
              description: 'Détails additionnels sur l\'erreur'
            }
          }
        },
        ValidationError: {
          type: 'object',
          required: ['error', 'validationErrors'],
          properties: {
            error: {
              type: 'string',
              example: 'Données invalides'
            },
            validationErrors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Nom du champ en erreur'
                  },
                  message: {
                    type: 'string',
                    description: 'Message d\'erreur pour ce champ'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Non autorisé',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Token d\'authentification manquant ou invalide'
              }
            }
          }
        },
        Forbidden: {
          description: 'Accès refusé',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Permissions insuffisantes'
              }
            }
          }
        },
        NotFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Ressource non trouvée'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Erreur serveur interne',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Erreur serveur interne'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        cookieAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentification et gestion des sessions'
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs'
      },
      {
        name: 'Mairies',
        description: 'Gestion des mairies'
      },
      {
        name: 'Salles',
        description: 'Gestion des salles'
      },
      {
        name: 'Reservations',
        description: 'Gestion des réservations'
      },
      {
        name: 'Files',
        description: 'Gestion des fichiers'
      },
      {
        name: 'Search',
        description: 'Recherche et filtres'
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/pages/api/**/*.ts'
  ]
}

const specs = swaggerJsdoc(options)

export default specs
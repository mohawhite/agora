import nodemailer from 'nodemailer'
import logger from './logger'

const transporter = nodemailer.createTransporter({
  host: process.env.MAILTRAP_HOST,
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: '"Agora" <noreply@agora.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Fallback text version
    })

    logger.info(`Email envoyé avec succès à ${options.to}: ${info.messageId}`)
    return true
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email:', error)
    return false
  }
}

// Templates d'emails
export const emailTemplates = {
  reservationCreated: (data: {
    userName: string
    salleName: string
    mairieNom: string
    startDate: string
    endDate: string
    totalPrice: number
    reservationId: string
  }) => ({
    subject: `Demande de réservation - ${data.salleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e11d48, #f43f5e); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏛️ Agora</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Bonjour ${data.userName},</h2>
          
          <p>Votre demande de réservation a été envoyée avec succès !</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #e11d48;">Détails de votre réservation</h3>
            <p><strong>Salle:</strong> ${data.salleName}</p>
            <p><strong>Mairie:</strong> ${data.mairieNom}</p>
            <p><strong>Date et heure:</strong> ${data.startDate} - ${data.endDate}</p>
            <p><strong>Prix total:</strong> ${data.totalPrice}€</p>
            <p><strong>Numéro de réservation:</strong> ${data.reservationId}</p>
          </div>
          
          <p>Votre demande est actuellement <strong>en attente de validation</strong> par la mairie.</p>
          <p>Vous recevrez un email de confirmation dès que votre réservation sera validée.</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/reservations" 
               style="background: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes réservations
            </a>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Merci d'utiliser Agora pour vos réservations de salles !
          </p>
        </div>
      </div>
    `
  }),

  reservationConfirmed: (data: {
    userName: string
    salleName: string
    mairieNom: string
    mairieEmail?: string
    mairiePhone?: string
    startDate: string
    endDate: string
    totalPrice: number
  }) => ({
    subject: `Réservation confirmée - ${data.salleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Réservation confirmée</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Excellente nouvelle ${data.userName} !</h2>
          
          <p>Votre réservation a été <strong style="color: #059669;">confirmée</strong> par la mairie.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #059669;">Votre réservation</h3>
            <p><strong>Salle:</strong> ${data.salleName}</p>
            <p><strong>Mairie:</strong> ${data.mairieNom}</p>
            <p><strong>Date et heure:</strong> ${data.startDate} - ${data.endDate}</p>
            <p><strong>Prix total:</strong> ${data.totalPrice}€</p>
          </div>
          
          ${data.mairieEmail || data.mairiePhone ? `
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0277bd;">Contact de la mairie</h4>
            ${data.mairieEmail ? `<p>📧 ${data.mairieEmail}</p>` : ''}
            ${data.mairiePhone ? `<p>📞 ${data.mairiePhone}</p>` : ''}
          </div>
          ` : ''}
          
          <p><strong>Prochaines étapes :</strong></p>
          <ul>
            <li>Vous pouvez contacter la mairie pour les détails pratiques</li>
            <li>Rendez-vous à l'heure prévue le jour de votre événement</li>
            <li>N'oubliez pas d'apporter une pièce d'identité</li>
          </ul>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/reservations" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes réservations
            </a>
          </div>
        </div>
      </div>
    `
  }),

  reservationCancelled: (data: {
    userName: string
    salleName: string
    mairieNom: string
    startDate: string
    endDate: string
    reason?: string
  }) => ({
    subject: `Réservation annulée - ${data.salleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">❌ Réservation annulée</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Bonjour ${data.userName},</h2>
          
          <p>Nous sommes désolés de vous informer que votre réservation a été <strong>annulée</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Réservation annulée</h3>
            <p><strong>Salle:</strong> ${data.salleName}</p>
            <p><strong>Mairie:</strong> ${data.mairieNom}</p>
            <p><strong>Date et heure:</strong> ${data.startDate} - ${data.endDate}</p>
            ${data.reason ? `<p><strong>Motif:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p>N'hésitez pas à rechercher d'autres salles disponibles ou à contacter directement la mairie pour plus d'informations.</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/salles" 
               style="background: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Rechercher d'autres salles
            </a>
          </div>
        </div>
      </div>
    `
  }),

  newReservationForMairie: (data: {
    mairieNom: string
    salleName: string
    userName: string
    userEmail: string
    userPhone?: string
    startDate: string
    endDate: string
    totalPrice: number
    message?: string
    reservationId: string
  }) => ({
    subject: `Nouvelle demande de réservation - ${data.salleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📅 Nouvelle demande de réservation</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Bonjour ${data.mairieNom},</h2>
          
          <p>Vous avez reçu une nouvelle demande de réservation à traiter.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #7c3aed;">Détails de la réservation</h3>
            <p><strong>Salle:</strong> ${data.salleName}</p>
            <p><strong>Date et heure:</strong> ${data.startDate} - ${data.endDate}</p>
            <p><strong>Prix total:</strong> ${data.totalPrice}€</p>
            <p><strong>Numéro de réservation:</strong> ${data.reservationId}</p>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0277bd;">Informations du client</h4>
            <p><strong>Nom:</strong> ${data.userName}</p>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            ${data.userPhone ? `<p><strong>Téléphone:</strong> ${data.userPhone}</p>` : ''}
            ${data.message ? `<p><strong>Message:</strong><br>${data.message}</p>` : ''}
          </div>
          
          <p><strong>Actions requises :</strong></p>
          <p>Connectez-vous à votre espace mairie pour accepter ou refuser cette demande.</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/mairie/reservations" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Gérer les réservations
            </a>
          </div>
        </div>
      </div>
    `
  })
}
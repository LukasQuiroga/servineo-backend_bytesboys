// En: src/services/notifications/notification.service.ts

import { EmailProvider } from './email.provider';

class NotificationService {
  private emailProvider: EmailProvider;

  constructor() {
    this.emailProvider = new EmailProvider();
  }

  /**
   * Envía las notificaciones de confirmación tanto al Fixer como al Requester.
   */
  public async sendAppointmentConfirmation(
    fixer: any, 
    requester: any, 
    appointment: any, 
    isNewAppointment: boolean
  ) {
    
    // --- 1. Preparamos los datos ---
    const requesterName = requester.name || 'Cliente';
    const fixerName = fixer.name || 'Profesional';
    const appointmentDate = new Date(appointment.starting_time).toLocaleString('es-ES', { 
        dateStyle: 'long', 
        timeStyle: 'short' 
    });

    // --- 2. Notificación para el Requester (Cliente) ---
    if (requester.email) {
        const subjectRequester = isNewAppointment 
            ? "Confirmación de tu cita en Servineo" 
            : "Tu cita ha sido reagendada";
        
        const bodyRequester = `
            <h1>¡Hola ${requesterName}!</h1>
            <p>Tu cita con <strong>${fixerName}</strong> para el <strong>${appointmentDate}</strong> ha sido confirmada.</p>
            <p>Descripción del trabajo: ${appointment.appointment_description || 'No especificada'}</p>
            <hr />
            <p>Este es un correo automático de Servineo.</p>
        `;
        
        // Usamos await para asegurarnos de que se intente enviar
        await this.emailProvider.send(
            requester.email,
            subjectRequester,
            bodyRequester
        );
    }

    // --- 3. Notificación para el Fixer ---
    if (fixer.email) {
        const subjectFixer = isNewAppointment 
            ? "¡Tienes una nueva cita!" 
            : "Una cita ha sido reagendada";
            
        const bodyFixer = `
            <h1>¡Hola ${fixerName}!</h1>
            <p>Tienes una nueva cita con <strong>${requesterName}</strong> para el <strong>${appointmentDate}</strong>.</p>
            <p>Contacto del cliente: ${requester.phone || 'No especificado'}</p>
            <p>Descripción: ${appointment.appointment_description || 'No especificada'}</p>
            <hr />
            <p>Este es un correo automático de Servineo.</p>
        `;

        await this.emailProvider.send(
            fixer.email,
            subjectFixer,
            bodyFixer
        );
    }
  }

  // Tu función sendGenericEmail puede seguir existiendo si la necesitas para otra cosa
  public async sendGenericEmail(to: string, subject: string, body: string) {
    const htmlBody = `
      <h1>${subject}</h1>
      <p>${body}</p>
      <hr />
      <p>Este es un correo automático de Servineo.</p>
    `;
    
    await this.emailProvider.send(to, subject, htmlBody);
  }
}

// Exportamos una única instancia (Singleton) para usar en toda la app
export const notificationService = new NotificationService();
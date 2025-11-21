// En: src/services/notifications/notification.service.ts

import { EmailProvider } from './email.provider.js';
import { WhatsAppProvider } from './whatsapp.provider.js';

// funcion pra extraer fecha y hora en formato localizado
function formatLocalizedDateTime(isoString: string | Date): string {
  if (!isoString) return '[No especificada]';
  const date = new Date(isoString);

  const formatted = date.toLocaleString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}


class NotificationService {
  private emailProvider: EmailProvider;
  private whatsappProvider: WhatsAppProvider;

  constructor() {
    this.emailProvider = new EmailProvider();
    this.whatsappProvider = new WhatsAppProvider();
  }

  // 1. Lógica para enviar notificaciones de confirmación de cita (Agendada)
  public async sendAppointmentConfirmation(
    fixer: any,
    requester: any,
    appointment: any
  ) {

    // datos necesarios
    const fixerName = fixer.name || 'Profesional';
    const fixerEmail = fixer.email;
    const fixerPhone = fixer.whatsapp || fixer.phone;

    const requesterName = requester.name || 'Cliente';
    const requesterPhone = requester.phone || requester.whatsapp;
    const requesterEmail = requester.email;

    const newDateTimeFormatted = formatLocalizedDateTime(appointment.starting_time);
    const modalityText = appointment.appointment_type === 'presential' ? 'Presencial' : 'Virtual';
    const detailsText = appointment.appointment_description || 'Sin descripción';

    const modalityDetails = appointment.appointment_type === 'presential'
        ? `${appointment.display_name_location || 'Ubicación no especificada'}`
        : `${appointment.link_id || 'Enlace no especificado'}`;


    // --- NOTIFICACIÓN AL FIXER (Profesional) ---

    const fixerSubject = `📅 NUEVA CITA AGENDADA`;
    const fixerWhatsAppMessage =
`*📅 NUEVA CITA AGENDADA*

Hola *${fixerName}*,

Tienes un nuevo servicio:

*Cliente:* ${requesterName}

*Fecha y Hora:* ${newDateTimeFormatted}

*Modalidad:* ${modalityText}

*Servicio solicitado:* ${detailsText}

*Ubicación/Enlace:* ${modalityDetails}

Por favor, revisa mas detalles en la app.
¡Gracias por ser parte de Servineo!`;

    // A. Enviar WhatsApp al Fixer
    if (fixerPhone) {
      try {
        await this.whatsappProvider.send(fixerPhone, fixerWhatsAppMessage);
      } catch (waError) {
         console.error(`🚨 Error al enviar WHATSAPP a ${fixerPhone}:`, (waError as Error).message);
      }
    }

    // B. Enviar Email al Fixer
    if (fixerEmail) {
      try {
        const fixerEmailBody = fixerWhatsAppMessage
          .replace(/\*/g, '')
          .replace(/\n/g, '<br>');

        await this.emailProvider.send(fixerEmail, fixerSubject, fixerEmailBody);
      } catch (emailError) {
         console.error(`🚨 Error al enviar EMAIL a ${fixerEmail}:`, (emailError as Error).message);
      }
    }


    // --- NOTIFICACIÓN AL REQUESTER (Cliente) ---

    const requesterEmailSubject = `✅ ¡Cita Agendada Exitosamente!`;
    const dateText = newDateTimeFormatted.replace(/el\s+/, '').replace(/\s+a\s+las/i, ' a las');

    // A. Plantilla WhatsApp Requester
    const requesterWhatsAppMessage =
`*✅ ¡Cita Agendada Exitosamente!*

*Profesional asignado:*
${fixerName}

*Fecha y hora:*
${dateText}

*Modalidad:*
${modalityText}

${modalityDetails}

*Detalles:*
${detailsText}

*Tu cita ha sido confirmada.*`;


    // B. Enviar WhatsApp al Requester
    if (requesterPhone) {
      try {
        await this.whatsappProvider.send(requesterPhone, requesterWhatsAppMessage);
      } catch (waError) {
        console.error(`🚨 Error al enviar WHATSAPP a ${requesterPhone}:`, (waError as Error).message);
      }
    }

    // C. Enviar Email al Requester
    if (requesterEmail) {
      try {
        const requesterEmailBody = requesterWhatsAppMessage
          .replace(/\*/g, '')
          .replace(/\n/g, '<br>');

        await this.emailProvider.send(requesterEmail, requesterEmailSubject, requesterEmailBody);
      } catch (emailError) {
        console.error(`🚨 Error al enviar EMAIL a ${requesterEmail}:`, (emailError as Error).message);
      }
    }
  }


  /**
   * 2. Lógica para enviar notificaciones de cita REPROGRAMADA
   */
  public async sendAppointmentRescheduleNotification(
      fixer: any,
      requester: any,
      old_starting_time: string | Date,
      newAppointment: any
  ) {
      console.log(">>> Iniciando envío de notificaciones de REPROGRAMACIÓN...");

      // Datos necesarios
      const fixerName = fixer.name || 'Profesional';
      const fixerEmail = fixer.email;
      const fixerPhone = fixer.whatsapp || fixer.phone;

      const requesterName = requester.name || 'Cliente';
      const requesterEmail = requester.email;
      const requesterPhone = requester.phone || requester.whatsapp;

      const oldDateTimeFormatted = formatLocalizedDateTime(old_starting_time);
      const newDateTimeFormatted = formatLocalizedDateTime(newAppointment.starting_time);
      const detailsText = newAppointment.appointment_description || 'Sin descripción';
      const modalityText = newAppointment.appointment_type === 'presential' ? 'Presencial' : 'Virtual';
      const reprogramReason = newAppointment.reprogram_reason || 'No especificado';
      const calendarLink = 'https://servineo.com/calendar';

      const oldDateText = oldDateTimeFormatted.replace(/el\s+/, '').replace(/\s+a\s+las/i, ' a las');
      const newDateText = newDateTimeFormatted.replace(/el\s+/, '').replace(/\s+a\s+las/i, ' a las');


      // --- 1. NOTIFICACIÓN AL FIXER (Profesional) ---

      const fixerSubject = `🔄 CITA REPROGRAMADA`;
      const fixerWhatsAppMessage =
`*🔄 CITA REPROGRAMADA*

Hola *${fixerName}*,

El cliente *${requesterName}* ha reprogramado su cita.

*Motivo:* ${reprogramReason}

*Fecha anterior:*
${oldDateText}

*Nueva fecha:*
${newDateText}

*Servicio:* ${detailsText}
*Modalidad:* ${modalityText}

Por favor, revisa tu calendario en la app.`;

      // A. Enviar WhatsApp al Fixer
      if (fixerPhone) {
          try {
              await this.whatsappProvider.send(fixerPhone, fixerWhatsAppMessage);
              console.log(`>>> 🟢 WhatsApp de reprogramación enviado al Fixer (${fixerPhone})`);
          } catch (waError) {
              console.error(`🚨 Error al enviar WHATSAPP de reprogramación a ${fixerPhone}:`, (waError as Error).message);
          }
      } else {
          console.warn(">>> ⚠️ No se encontró teléfono para el Fixer, no se envió WhatsApp.");
      }

      // B. Enviar Email al Fixer
      if (fixerEmail) {
          try {
              const fixerEmailBody = fixerWhatsAppMessage
                  .replace(/\*/g, '')
                  .replace(/\n/g, '<br>')
                  .replace(`[Ver Calendario](${calendarLink})`, `<p><a href="${calendarLink}">Ver Calendario</a></p>`);

              await this.emailProvider.send(fixerEmail, fixerSubject, fixerEmailBody);
              console.log(`>>> 🟢 Email de reprogramación enviado al Fixer (${fixerEmail})`);
          } catch (emailError) {
              console.error(`🚨 Error al enviar EMAIL de reprogramación a ${fixerEmail}:`, (emailError as Error).message);
          }
      }

      // --- 2. NOTIFICACIÓN AL REQUESTER (Cliente) ---

      const requesterSubject = `🔄 Confirmación de Reprogramación`;
      const requesterWhatsAppMessage =
`*🔄 Confirmación de Reprogramación*

Hola *${requesterName}*,

Tu cita con *${fixerName}* ha sido reprogramada exitosamente.

*Nueva fecha:*
${newDateText}

*Motivo:* ${reprogramReason}

¡Gracias por confiar en Servineo!`;

      // C. Enviar WhatsApp al Requester
      if (requesterPhone) {
          try {
              await this.whatsappProvider.send(requesterPhone, requesterWhatsAppMessage);
              console.log(`>>> 🟢 WhatsApp de reprogramación enviado al Requester (${requesterPhone})`);
          } catch (waError) {
              console.error(`🚨 Error al enviar WHATSAPP de reprogramación a ${requesterPhone}:`, (waError as Error).message);
          }
      }

      // D. Enviar Email al Requester
      if (requesterEmail) {
          try {
              const requesterEmailBody = requesterWhatsAppMessage
                  .replace(/\*/g, '')
                  .replace(/\n/g, '<br>');

              await this.emailProvider.send(requesterEmail, requesterSubject, requesterEmailBody);
              console.log(`>>> 🟢 Email de reprogramación enviado al Requester (${requesterEmail})`);
          } catch (emailError) {
              console.error(`🚨 Error al enviar EMAIL de reprogramación a ${requesterEmail}:`, (emailError as Error).message);
          }
      }
  }
}

export const notificationService = new NotificationService();
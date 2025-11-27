// En: src/services/notifications/notification.service.ts

import { EmailProvider } from './email.provider.js';
import { WhatsAppProvider } from './whatsapp.provider.js';
// Nuevos imports necesarios para la HU de Cancelaciones
import Notification from '../../modules/notifications/notification.model.js';
import { ENV } from '../../config/env.config.js';
import { Types } from 'mongoose';

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

  public async notifyAppointmentCancellation(
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    fixerName: string,
    appointmentDate: Date | string
  ): Promise<boolean> {
    // 1. Formatear la fecha (igual que antes)
    const dateObj = new Date(appointmentDate);
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let formattedDate = formatter.format(dateObj);
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    // 2. Construir el mensaje
    const message = `Hola ${clientName} lamentamos informarte que el fixer ${fixerName} no podra atender tu solicitud de la fecha: ${formattedDate}. Disculpa las molestias`;
    const emailSubject = 'Actualización sobre tu solicitud de servicio - Servineo';

    console.log(`[Notification] Iniciando proceso de notificación para cancelación de cita...`);

    // 3. Intentar enviar por WhatsApp (3 intentos)
    const whatsappSuccess = await this.trySendWithRetries(
      'WhatsApp',
      () => this.whatsappProvider.send(clientPhone, message)
    );

    // 4. Intentar enviar por Email (3 intentos)
    const emailSuccess = await this.trySendWithRetries(
      'Email',
      () => this.emailProvider.send(clientEmail, emailSubject, message)
    );

    // 5. Evaluar resultados
    if (!whatsappSuccess) {
      console.warn(`[Alerta] El medio WhatsApp se marcó como FALLIDO para ${clientPhone} tras 3 intentos.`);
    }

    if (!emailSuccess) {
      console.warn(`[Alerta] El medio Email se marcó como FALLIDO para ${clientEmail} tras 3 intentos.`);
    }

    // 6. Verificar Failover (Ambos fallaron)
    if (!whatsappSuccess && !emailSuccess) {
      console.error('[FAILOVER CRÍTICO] Ambos medios de notificación fallaron. Se requiere intervención manual.');
      
      return false; 
    }

    console.log('[Notification] Proceso finalizado. Al menos un medio fue exitoso.');
    return true;
  }

  /**
   * 4. Alerta de Múltiples Cancelaciones (HU)
   */
  public async notifyFixerExcessiveCancellations(
    fixerId: string | Types.ObjectId,
    fixerName: string,
    fixerEmail: string,
    fixerPhone: string,
    totalCancellations: number,
    lastCancellationDate: Date,
    isEscalated: boolean = false
  ): Promise<void> {

    console.log(`[Notification] ⚠️ Procesando alerta de MULTIPLES CANCELACIONES para ${fixerName}. Total: ${totalCancellations}. Escalado: ${isEscalated}`);

    // Formatear fecha al estilo solicitado: "02/11/2025 18:05"
    const dateFormatted = new Date(lastCancellationDate).toLocaleString('es-BO', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    });

    // Definir asunto y cuerpo según si es advertencia o escalamiento (HU: "Entonces debe recibir una nueva notificación actualizada")
    let subject = isEscalated 
        ? '🚨 AVISO URGENTE: Restricción por cancelaciones excesivas' 
        : '⚠️ ALERTA: Múltiples cancelaciones detectadas';

    let escalationText = isEscalated 
        ? '\n\n*NOTA:* Hemos notificado al coordinador debido a la recurrencia de este comportamiento.' 
        : '';

    const messageBody = 
`ALERTA DE MULTIPLES CANCELACIONES

Hola *${fixerName}*

Has alcanzado el límite de *${totalCancellations}* cancelaciones consecutivas.

Total de cancelaciones recientes: *${totalCancellations}*.
Ultima cancelación: *${dateFormatted}*.

Evitar cancelaciones innecesarias para no recibir restricciones.${escalationText}`;

    // A. Envío por canales (Prioridad: WhatsApp -> Failover: Email)
    let sendStatus: 'SUCCESS' | 'FAILED' = 'FAILED';
    let usedChannel: 'whatsapp' | 'email' = 'whatsapp';
    let errorDetails: string | null = null;

    try {
        let sent = false;
        
        // 1. Intentar WhatsApp (Canal preferido)
        if (fixerPhone) {
            sent = await this.trySendWithRetries('WhatsApp', () => this.whatsappProvider.send(fixerPhone, messageBody));
        }

        // 2. Failover a Email si WhatsApp falla o no existe
        if (!sent && fixerEmail) {
            console.log('[Failover] Usando Email para alerta de cancelación.');
            usedChannel = 'email';
            const emailHtml = messageBody.replace(/\*/g, '').replace(/\n/g, '<br>');
            sent = await this.trySendWithRetries('Email', () => this.emailProvider.send(fixerEmail, subject, emailHtml));
        }

        if (sent) sendStatus = 'SUCCESS';

    } catch (err) {
        errorDetails = (err as Error).message;
        console.error('Error general enviando alerta:', err);
    }

    // B. PERSISTENCIA: Guardar en BD para el Historial (Cumple HU: "Dado que el fixer consulta su historial...")
    try {
        await Notification.create({
            users_id: fixerId,
            recipient_phone: fixerPhone || '',
            notification_type: usedChannel,
            message_content: messageBody,
            send_status: sendStatus,
            leido: false,
            tipo: 'ALERT_CANCELLATION', 
            estado: isEscalated ? 'HIGH_PRIORITY' : 'WARNING', 
            error_details: errorDetails
        });
        console.log(`[Notification] Historial actualizado para ${fixerName} (Estado: ${sendStatus})`);
    } catch (dbError) {
        console.error('Error guardando notificación en BD:', dbError);
    }

    // C. ESCALAMIENTO: Notificar al coordinador (Cumple HU: "escalar al coordinador correspondiente")
    if (isEscalated) {
        const adminEmail = ENV.SMTP_USER || 'admin@servineo.com'; 
        const adminMsg = `El fixer ${fixerName} (${fixerEmail}) ha acumulado ${totalCancellations} cancelaciones consecutivas. Se requiere revisión manual.`;
        
        // Enviamos "fire and forget"
        this.emailProvider.send(adminEmail, `[COORDINADOR] Revisión de Fixer: ${fixerName}`, adminMsg)
            .catch(e => console.error('Error notificando admin:', e));
    }
  }

  /**
   * Método auxiliar para reintentar una acción hasta 3 veces.
   */
  private async trySendWithRetries(channelName: string, action: () => Promise<any>): Promise<boolean> {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await action();
        console.log(`[${channelName}] Envío exitoso en el intento ${attempt}.`);
        return true; // Éxito
      } catch (error) {
        console.error(`[${channelName}] Error en intento ${attempt}/${MAX_ATTEMPTS}:`, error);
        
        if (attempt < MAX_ATTEMPTS) {
          // Opcional: Esperar un poco antes de reintentar (backoff simple de 1 segundo)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return false; // Falló después de todos los intentos
  }


}

export const notificationService = new NotificationService();
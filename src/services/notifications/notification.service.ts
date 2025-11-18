// En: src/services/notifications/notification.service.ts

import { EmailProvider } from './email.provider';
import { WhatsAppProvider } from './whatsapp.provider';

// funcion pra extraer fecha y hora en formato localizado  no borrar pe cjuds
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

  // funcion para enviar notificaciones de confirmacion de citas pueden crearse otra funcion para notificar
  // cancelaciones o reprogramaciones
  // o siquieren refactorizar esta funcion para que sea mas generica xd
  // pst: si se crean una nueva fucion no se olviden de llamarla en el servicio correspondiente

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


    //2. NOTIFICACIÓN AL FIXER (Profesional)
    
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
    
    // B. Enviar Email al Fixer (CORREGIDO)
    if (fixerEmail) {
      try {
        // Convertimos el texto de WhatsApp a un HTML simple (reemplazando \n con <br>)
        const fixerEmailBody = fixerWhatsAppMessage
          .replace(/\*/g, '') // Quita asteriscos
          .replace(/\n/g, '<br>'); // Convierte saltos de línea a <br>

        await this.emailProvider.send(
            fixerEmail,
            fixerSubject,
            fixerEmailBody // Enviamos el HTML simple
        );
      } catch (emailError) {
         console.error(`🚨 Error al enviar EMAIL a ${fixerEmail}:`, (emailError as Error).message);
      }
    }


    // 3. NOTIFICACIÓN AL REQUESTER (Cliente)
    
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

    // C. Enviar Email al Requester (MODIFICADO A TEXTO PLANO)
    if (requesterEmail) {
      try {
        // Convertimos el texto de WhatsApp a un HTML simple (reemplazando \n con <br>)
        const requesterEmailBody = requesterWhatsAppMessage
          .replace(/\*/g, '') // Quita asteriscos
          .replace(/\n/g, '<br>'); // Convierte saltos de línea a <br>

        await this.emailProvider.send(
            requesterEmail,
            requesterEmailSubject,
            requesterEmailBody 
        );
      } catch (emailError) {
        console.error(`🚨 Error al enviar EMAIL a ${requesterEmail}:`, (emailError as Error).message);
      }
    }
  }

  
}

export const notificationService = new NotificationService();
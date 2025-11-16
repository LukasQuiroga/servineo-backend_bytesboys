// src/api/controllers/notification.controller.ts

import { Request, Response } from 'express';
// Importamos nuestra instancia del servicio
import { notificationService } from '../../services/notifications/notification.service';

/**
 * Manejador para la solicitud de envío de email
 */
export const handleSendEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, body } = req.body;

    // Validación simple
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        message: 'Faltan datos: "to", "subject" y "body" son requeridos' 
      });
    }

    // 1. Llama al servicio
    await notificationService.sendGenericEmail(to, subject, body);

    // 2. Responde al frontend
    return res.status(200).json({ message: 'Email enviado correctamente' });

  } catch (error) {
    console.error('Error en notification.controller:', error);
    return res.status(500).json({ message: 'Error interno al enviar el email' });
  }
};
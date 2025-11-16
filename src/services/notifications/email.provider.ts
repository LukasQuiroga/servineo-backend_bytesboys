
import nodemailer from 'nodemailer';
import { ENV } from '../../config/env.config';

export class EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Validamos que las variables de entorno existan
    if (!ENV.SMTP_USER || !ENV.SMTP_PASSWORD) {
      console.error('Error: Faltan variables de entorno SMTP_USER o SMTP_PASSWORD');
      throw new Error('Configuración SMTP incompleta'); // Lanzar error en vez de return
    }

    // 1. Configuramos el "transporter" de Nodemailer
    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE, // false para puerto 587 (STARTTLS)
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASSWORD,
      },
    });

    this.verifyConnection();
  }

  // 2. Verificamos la conexión al iniciar
  private async verifyConnection() {
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log('📧 Servidor SMTP de Gmail listo para enviar correos.');
      }
    } catch (error) {
      console.error('Error al verificar conexión SMTP:', error);
    }
  }

  // 3. Método para enviar el correo
  public async send(to: string, subject: string, htmlBody: string) {
    if (!this.transporter) {
      throw new Error('El transportador de email no está inicializado.');
    }
    
    try {
      const mailOptions = {
        from: `"Servineo" <${ENV.SMTP_FROM}>`, 
        to: to,
        subject: subject,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado. Message ID:', info.messageId);
      return info;

    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      throw error; // Propagar el error original para mejor debugging
    }
  }
}
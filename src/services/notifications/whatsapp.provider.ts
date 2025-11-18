// En: src/services/notifications/whatsapp.provider.ts

import * as dotenv from 'dotenv';
import axios from 'axios'; // Usamos axios que ya está en tu proyecto

dotenv.config();

const apiUrl = process.env.WHATSAPP_BASE_URL;
const apiKey = process.env.WHATSAPP_API_KEY;
const instanceName = process.env.WHATSAPP_INSTANCE; 

export class WhatsAppProvider {

  constructor() {
    if (!apiUrl || !apiKey || !instanceName) {
      console.warn('⚠️  Advertencia: Las variables de Evolution API (URL, KEY o INSTANCE) no están configuradas en .env. Los mensajes de WhatsApp fallarán.');
    }
  }

  /**
   * Formatea un número de teléfono.
   * (¡Función actualizada basada en tu nuevo código!)
   */
  private formatPhoneNumber(phone: string): string {
    // 1. Quitar todo lo que no sea un dígito
    let normalized = String(phone).replace(/\D/g, ''); 

    // 2. Si es un número de Bolivia, añadir 591
    if (normalized.length === 8 && (normalized.startsWith('6') || normalized.startsWith('7'))) {
      normalized = `591${normalized}`;
    }

    // 3. Añadir el sufijo @c.us (¡LA PISTA CLAVE!)
    if (!normalized.endsWith('@c.us')) {
      normalized += '@c.us';
    }
    // Devuelve: "59173796540@c.us"
    return normalized;
  }

  /**
   * Envía un mensaje de texto simple usando Evolution API.
   * (¡Configuración corregida!)
   */
  public async send(to: string, body: string): Promise<boolean> {
    if (!apiUrl || !apiKey || !instanceName) {
      console.error('❌ Error: Faltan las variables de entorno de Evolution API.');
      return false;
    }

    // ¡Se usará el nuevo formato con @c.us!
    const formattedNumber = this.formatPhoneNumber(to); 

    // --- 1. ENDPOINT CORRECTO ---
    // Volvemos a 'sendText', que sí existe (confirmado por tu código)
    const endpoint = `${apiUrl}/message/sendText/${instanceName}`;

    console.log(`Enviando WhatsApp vía Evolution a: ${endpoint}`);

    // --- 2. PAYLOAD CORRECTO ---
    // (Basado en tu nuevo código y el primer error 400)
    const payload = {
      number: formattedNumber, // "59173796540@c.us"
      text: body, // "Hola..."
      options: {
        delay: 1200, 
        presence: "composing"
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'apikey': apiKey
    };

    try {
      // --- ESTA ES LA LLAMADA REAL A LA API ---
      const response = await axios.post(endpoint, payload, { headers });

      console.log(`✅ Mensaje de WhatsApp enviado a ${formattedNumber}. Status: ${response.status}`);
      return true;

    } catch (error) {
      console.error(`❌ Error al enviar WhatsApp a ${formattedNumber}:`);

      if (axios.isAxiosError(error) && error.response) {
        console.error('Detalle del error (Evolution API):', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error desconocido:', (error as Error).message);
      }
      return false;
    }
  }
}
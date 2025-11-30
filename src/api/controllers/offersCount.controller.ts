import { Request, Response } from 'express';
import { Offer } from '../../models/offer.model';

// GET /api/offers/count-since?date=YYYY-MM-DDTHH:mm:ss.sssZ
export async function getOffersCountSinceController(req: Request, res: Response) {
  try {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'Falta parámetro date' });
    }
    const sinceDate = new Date(date);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Fecha inválida' });
    }
    
    console.log('[OFFERS COUNT] Fecha recibida:', date);
    console.log('[OFFERS COUNT] Fecha parseada:', sinceDate);
    
    const count = await Offer.countDocuments({ createdAt: { $gte: sinceDate } });
    
    console.log('[OFFERS COUNT] Cantidad encontrada:', count);
    
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('[OFFERS COUNT] Error:', error);
    return res.status(500).json({ success: false, message: 'Error consultando ofertas', error: error instanceof Error ? error.message : String(error) });
  }
}

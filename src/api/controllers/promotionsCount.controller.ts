import { Request, Response } from 'express';
import Promotion from '../../models/promotion.model';
// GET /api/promotions/count-since?date=YYYY-MM-DDTHH:mm:ss.sssZ
export async function getPromotionsCountSinceController(req: Request, res: Response) {
  try {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'Falta parámetro date' });
    }
    const sinceDate = new Date(date);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Fecha inválida' });
    }
    
    console.log('[PROMOTIONS COUNT] Fecha recibida:', date);
    console.log('[PROMOTIONS COUNT] Fecha parseada:', sinceDate);
    
    const count = await Promotion.countDocuments({ createdAt: { $gte: sinceDate } });
    
    console.log('[PROMOTIONS COUNT] Cantidad encontrada:', count);
    
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('[PROMOTIONS COUNT] Error:', error);
    return res.status(500).json({ success: false, message: 'Error consultando promociones', error: error instanceof Error ? error.message : String(error) });
  }
}

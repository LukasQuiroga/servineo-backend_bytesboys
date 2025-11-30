import { Router } from 'express';
import { getPromotionsCountSinceController } from '../controllers/promotionsCount.controller';
const router = Router();
// GET /api/promotions/count-since?date=YYYY-MM-DDTHH:mm:ss.sssZ
router.get('/promotions/count-since', getPromotionsCountSinceController);
export default router;

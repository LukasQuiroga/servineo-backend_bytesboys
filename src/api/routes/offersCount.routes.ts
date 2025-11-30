import { Router } from 'express';
import { getOffersCountSinceController } from '../controllers/offersCount.controller';

const router = Router();

// GET /api/offers/count-since?date=YYYY-MM-DDTHH:mm:ss.sssZ
router.get('/offers/count-since', getOffersCountSinceController);

export default router;

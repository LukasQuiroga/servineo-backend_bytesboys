import { Router } from 'express';
import { Request, Response } from 'express';
import LocationRoutes from '../api/routes/location.routes.js';
import CreateRoutes from '../api/routes/create_appointment.routes.js';
import ReadRoutes from '../api/routes/read_appointment.routes.js';
import UpdateRoutes from '../api/routes/update_appointment.routes.js';
import GetScheduleRoutes from '../api/routes/get_schedule.routes.js';
// import HealthRoutes from '../modules/health/health.routes';
import Notification from '../modules/notifications/notification.routes.js';
import offersCountRoutes from '../api/routes/offersCount.routes.js';
import promotionsCountRoutes from '../api/routes/promotionsCount.routes.js';

const router = Router();

// router.use('/api', HealthRoutes);
router.use('/api/notifications', Notification);
router.use('/api/location', LocationRoutes);
router.use('/api/crud_create', CreateRoutes);
router.use('/api/crud_read', ReadRoutes);
router.use('/api/crud_update', UpdateRoutes);
router.use('/api/crud_read', GetScheduleRoutes);
router.use('/api', offersCountRoutes);
router.use('/api', promotionsCountRoutes);

router.use((req: Request, res: Response) => {
  console.log('Not found:', req.method, req.originalUrl);
  res.status(404).send({
    message: 'route not found',
  });
});

export default router;

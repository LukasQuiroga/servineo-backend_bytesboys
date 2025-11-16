// src/api/routes/notification.routes.ts

import { Router } from 'express';
import { handleSendEmail } from '../controllers/notification.controller';

const router = Router();

// Cuando el frontend llame a [POST] /api/notifications/send-email
// se ejecutará el controlador handleSendEmail
router.post('/send-email', handleSendEmail);

export default router;
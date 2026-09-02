import { Router } from 'express';
import { paystackWebhook } from '../controllers/webhook/webhook.controller';
import { quidaxWebhook } from '../controllers/webhook/quidax.controller';


const router = Router();


router.post('/paystack', paystackWebhook);
router.post('/quidax', quidaxWebhook);

export default router;
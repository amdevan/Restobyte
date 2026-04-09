import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { sendTestEmail, getEmailSettings, updateEmailSettings, sendTemplateEmail } from '../controllers/emailController.js';

const router = Router();
router.use(authenticate);

router.post('/test', sendTestEmail);
router.get('/settings', getEmailSettings);
router.put('/settings', updateEmailSettings);
router.post('/send-template', sendTemplateEmail);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { sendTestEmail, getEmailSettings, updateEmailSettings, sendTemplateEmail } from '../controllers/emailController.js';

const router = Router();
router.use(authenticate);

router.post('/test', requirePermission('settings.edit'), sendTestEmail);
router.get('/settings', requirePermission('settings.view'), getEmailSettings);
router.put('/settings', requirePermission('settings.edit'), updateEmailSettings);
router.post('/send-template', requirePermission('settings.edit'), sendTemplateEmail);

export default router;

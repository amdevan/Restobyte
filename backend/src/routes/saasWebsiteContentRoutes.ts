import { Router } from 'express';
import { getPublicSaasWebsiteContent } from '../controllers/saasWebsiteContentController.js';

const router = Router();

router.get('/saas-website-content', getPublicSaasWebsiteContent);

export default router;


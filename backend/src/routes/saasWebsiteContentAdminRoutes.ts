import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/authMiddleware.js';
import { getAdminSaasWebsiteContent, updateAdminSaasWebsiteContent } from '../controllers/saasWebsiteContentController.js';

const router = Router();

const requireSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};

router.get('/website-content', authenticate, requireSuperAdmin, getAdminSaasWebsiteContent);
router.put('/website-content', authenticate, requireSuperAdmin, updateAdminSaasWebsiteContent);

export default router;


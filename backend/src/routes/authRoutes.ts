import express from 'express';
import { register, login, impersonate, getMe } from '../controllers/authController.js';
import { authenticate, type AuthRequest } from '../middleware/authMiddleware.js';

const router = express.Router();

const requireSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/impersonate/:tenantId', authenticate, requireSuperAdmin, impersonate);

export default router;

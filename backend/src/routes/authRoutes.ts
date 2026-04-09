import express from 'express';
import { register, login, impersonate } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/impersonate/:tenantId', authenticate, impersonate);

export default router;

import { Router } from 'express';
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from '../controllers/menuItemController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

// Public endpoint with cache headers for faster QR menu loading
router.get('/', (req, res, next) => {
  // Set cache headers for unauthenticated requests (QR menu)
  if (!req.headers.authorization) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
  }
  next();
}, getMenuItems);

router.use(authenticate);
router.post('/', requirePermission('menu.create'), createMenuItem);
router.put('/:id', requirePermission('menu.edit'), updateMenuItem);
router.delete('/:id', requirePermission('menu.delete'), deleteMenuItem);

export default router;
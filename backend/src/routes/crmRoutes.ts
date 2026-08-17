import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { listLeads, createLead, updateLead, deleteLead, addNote, getNotes, convertLeadToTenant } from '../controllers/crmController.js';

const router = Router();

const requireSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};

router.use(authenticate);

router.get('/leads', requirePermission('settings.edit'), listLeads);
router.post('/leads', requirePermission('settings.edit'), createLead);
router.put('/leads/:id', requirePermission('settings.edit'), updateLead);
router.delete('/leads/:id', requirePermission('settings.edit'), deleteLead);
router.get('/leads/:id/notes', requirePermission('settings.edit'), getNotes);
router.post('/leads/:id/notes', requirePermission('settings.edit'), addNote);
router.post('/leads/:id/convert', requireSuperAdmin, convertLeadToTenant);

export default router;

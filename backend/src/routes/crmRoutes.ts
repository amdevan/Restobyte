import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { listLeads, createLead, updateLead, deleteLead, addNote, getNotes, convertLeadToTenant } from '../controllers/crmController.js';

const router = Router();

router.use(authenticate);

router.get('/leads', listLeads);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);
router.get('/leads/:id/notes', getNotes);
router.post('/leads/:id/notes', addNote);
router.post('/leads/:id/convert', convertLeadToTenant);

export default router;

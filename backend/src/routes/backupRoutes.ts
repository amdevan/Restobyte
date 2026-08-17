import { Router } from 'express';
import multer from 'multer';
import { createBackup, restoreBackup, uploadBackup, listBackups, deleteBackup, getBackupStats, getSchedule, updateSchedule, triggerBackupNow } from '../controllers/backupController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();
const upload = multer({ dest: '/tmp/backup-uploads/', limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB limit

router.use(authenticate);

router.get('/', requirePermission('reports.view'), listBackups);
router.get('/stats', requirePermission('reports.view'), getBackupStats);
router.post('/create', requirePermission('settings.edit'), createBackup);
router.post('/restore', requirePermission('settings.edit'), restoreBackup);
router.post('/upload', requirePermission('settings.edit'), upload.single('backupFile'), uploadBackup);
router.post('/trigger', requirePermission('settings.edit'), triggerBackupNow);
router.get('/schedule', requirePermission('settings.edit'), getSchedule);
router.put('/schedule', requirePermission('settings.edit'), updateSchedule);
router.delete('/:id', requirePermission('settings.edit'), deleteBackup);

export default router;

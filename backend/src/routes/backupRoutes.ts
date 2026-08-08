import { Router } from 'express';
import multer from 'multer';
import { createBackup, restoreBackup, uploadBackup, listBackups, deleteBackup, getBackupStats, getSchedule, updateSchedule, triggerBackupNow } from '../controllers/backupController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({ dest: '/tmp/backup-uploads/', limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB limit

router.use(authenticate);

router.get('/', listBackups);
router.get('/stats', getBackupStats);
router.post('/create', createBackup);
router.post('/restore', restoreBackup);
router.post('/upload', upload.single('backupFile'), uploadBackup);
router.post('/trigger', triggerBackupNow);
router.get('/schedule', getSchedule);
router.put('/schedule', updateSchedule);
router.delete('/:id', deleteBackup);

export default router;

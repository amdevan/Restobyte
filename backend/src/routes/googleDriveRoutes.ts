import { Router } from 'express';
import { getAuthUrl, handleCallback, getConnectionStatus, disconnect, backupToDrive, listDriveBackups, restoreFromDrive, deleteDriveBackup } from '../controllers/googleDriveController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Public callback (no auth — Google redirects here)
router.get('/callback', handleCallback);

// Protected routes
router.get('/auth-url', authenticate, getAuthUrl);
router.get('/status', authenticate, getConnectionStatus);
router.post('/disconnect', authenticate, disconnect);
router.post('/backup', authenticate, backupToDrive);
router.get('/backups', authenticate, listDriveBackups);
router.post('/restore', authenticate, restoreFromDrive);
router.delete('/backups/:fileId', authenticate, deleteDriveBackup);

export default router;

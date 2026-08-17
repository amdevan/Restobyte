import { Router } from 'express';
import { getAuthUrl, handleCallback, getConnectionStatus, disconnect, backupToDrive, listDriveBackups, restoreFromDrive, deleteDriveBackup } from '../controllers/googleDriveController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

// Public callback (no auth — Google redirects here)
router.get('/callback', handleCallback);

// Protected routes
router.get('/auth-url', authenticate, requirePermission('settings.edit'), getAuthUrl);
router.get('/status', authenticate, requirePermission('settings.view'), getConnectionStatus);
router.post('/disconnect', authenticate, requirePermission('settings.edit'), disconnect);
router.post('/backup', authenticate, requirePermission('settings.edit'), backupToDrive);
router.get('/backups', authenticate, requirePermission('settings.view'), listDriveBackups);
router.post('/restore', authenticate, requirePermission('settings.edit'), restoreFromDrive);
router.delete('/backups/:fileId', authenticate, requirePermission('settings.edit'), deleteDriveBackup);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAttendance,
  markOrUpdateAttendance,
  getPayrollRecords,
  upsertPayrollRecord,
} from '../controllers/employeeController.js';

const router = Router();

router.use(authenticate);

// Employees
router.get('/', requirePermission('users.view'), getEmployees);
router.post('/', requirePermission('users.create'), createEmployee);
router.put('/:id', requirePermission('users.edit'), updateEmployee);
router.delete('/:id', requirePermission('users.delete'), deleteEmployee);

// Attendance
router.get('/attendance', requirePermission('users.view'), getAttendance);
router.post('/attendance', requirePermission('users.edit'), markOrUpdateAttendance);

// Payroll
router.get('/payroll', requirePermission('accounting.view'), getPayrollRecords);
router.post('/payroll', requirePermission('accounting.manage'), upsertPayrollRecord);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
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
router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// Attendance
router.get('/attendance', getAttendance);
router.post('/attendance', markOrUpdateAttendance);

// Payroll
router.get('/payroll', getPayrollRecords);
router.post('/payroll', upsertPayrollRecord);

export default router;

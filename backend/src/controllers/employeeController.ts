import type { Request, Response } from 'express';
import prisma, { withRetry } from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

async function validateOutletAccess(user: any, outletId: string): Promise<boolean> {
  if (user.isSuperAdmin) return true;
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return false;
    const outlet = await prisma.outlet.findFirst({ where: { id: outletId, tenantId: user.tenantId } });
    return !!outlet;
  }
  const allowedOutletIds = Array.isArray(user.outletIds) && user.outletIds.length > 0
    ? user.outletIds.map(String)
    : (user.outletId ? [String(user.outletId)] : []);
  return allowedOutletIds.includes(outletId);
}

// ==================== Employees ====================

export const getEmployees = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = (req.query as any).outletId || user.outletId;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const employees = await withRetry(() => prisma.employee.findMany({
    where: { outletId: String(outletId) },
    orderBy: { name: 'asc' },
  }));
  res.json(employees);
};

export const createEmployee = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, name, employeeId, phone, email, address, dob, joiningDate, designation, salary, emergencyContactName, emergencyContactPhone, isActive, isWaiter, waiterId, photoUrl } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const employee = await withRetry(() => prisma.employee.create({
    data: {
      outletId: String(outletId),
      name,
      employeeId,
      phone,
      email: email || null,
      address: address || null,
      dob: dob || null,
      joiningDate,
      designation,
      salary: salary != null ? Number(salary) : null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      isActive: isActive !== false,
      isWaiter: isWaiter === true,
      waiterId: waiterId || null,
      photoUrl: photoUrl || null,
    },
  }));
  res.status(201).json(employee);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Employee not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { name, employeeId, phone, email, address, dob, joiningDate, designation, salary, emergencyContactName, emergencyContactPhone, isActive, isWaiter, waiterId, photoUrl } = req.body;
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(employeeId !== undefined ? { employeeId } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(address !== undefined ? { address: address || null } : {}),
      ...(dob !== undefined ? { dob: dob || null } : {}),
      ...(joiningDate !== undefined ? { joiningDate } : {}),
      ...(designation !== undefined ? { designation } : {}),
      ...(salary !== undefined ? { salary: salary != null ? Number(salary) : null } : {}),
      ...(emergencyContactName !== undefined ? { emergencyContactName: emergencyContactName || null } : {}),
      ...(emergencyContactPhone !== undefined ? { emergencyContactPhone: emergencyContactPhone || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isWaiter !== undefined ? { isWaiter } : {}),
      ...(waiterId !== undefined ? { waiterId: waiterId || null } : {}),
      ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
    },
  });
  res.json(employee);
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Employee not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.employee.delete({ where: { id } });
  res.json({ message: 'Employee deleted' });
};

// ==================== Attendance ====================

export const getAttendance = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, date, employeeId, startDate, endDate } = req.query as any;
  const effectiveOutletId = outletId || user.outletId;
  if (!effectiveOutletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(effectiveOutletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  // Get employee IDs for this outlet
  const employeeIds = (await prisma.employee.findMany({
    where: { outletId: String(effectiveOutletId) },
    select: { id: true },
  })).map(e => e.id);

  const where: any = { employeeId: { in: employeeIds } };
  if (date) where.date = date;
  if (employeeId) where.employeeId = employeeId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: [{ date: 'desc' }, { employeeName: 'asc' }],
  });
  res.json(records);
};

export const markOrUpdateAttendance = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({ message: 'records array is required' });
    return;
  }

  const results = [];
  for (const rec of records) {
    const { employeeId, employeeName, date, status, checkInTime, checkOutTime, notes } = rec;
    if (!employeeId || !date || !status) continue;

    const upserted = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: {
        employeeName: employeeName || '',
        status,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        notes: notes || null,
      },
      create: {
        employeeId,
        employeeName: employeeName || '',
        date,
        status,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        notes: notes || null,
      },
    });
    results.push(upserted);
  }
  res.json(results);
};

// ==================== Payroll ====================

export const getPayrollRecords = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, month, year } = req.query as any;
  const effectiveOutletId = outletId || user.outletId;
  if (!effectiveOutletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(effectiveOutletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const employeeIds = (await prisma.employee.findMany({
    where: { outletId: String(effectiveOutletId) },
    select: { id: true },
  })).map(e => e.id);

  const where: any = { employeeId: { in: employeeIds } };
  if (month) where.month = Number(month);
  if (year) where.year = Number(year);

  const records = await prisma.payroll.findMany({
    where,
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeName: 'asc' }],
  });
  res.json(records);
};

export const upsertPayrollRecord = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { employeeId, employeeName, month, year, baseSalary, presentDays, absentDays, lateDays, halfDays, deductions, netSalary, status, paidDate } = req.body;
  if (!employeeId || !month || !year) {
    res.status(400).json({ message: 'employeeId, month, and year are required' });
    return;
  }

  const record = await prisma.payroll.upsert({
    where: { employeeId_month_year: { employeeId, month: Number(month), year: Number(year) } },
    update: {
      employeeName: employeeName || '',
      baseSalary: Number(baseSalary) || 0,
      presentDays: Number(presentDays) || 0,
      absentDays: Number(absentDays) || 0,
      lateDays: Number(lateDays) || 0,
      halfDays: Number(halfDays) || 0,
      deductions: Number(deductions) || 0,
      netSalary: Number(netSalary) || 0,
      status: status || 'Pending',
      paidDate: paidDate ? new Date(paidDate) : null,
    },
    create: {
      employeeId,
      employeeName: employeeName || '',
      month: Number(month),
      year: Number(year),
      baseSalary: Number(baseSalary) || 0,
      presentDays: Number(presentDays) || 0,
      absentDays: Number(absentDays) || 0,
      lateDays: Number(lateDays) || 0,
      halfDays: Number(halfDays) || 0,
      deductions: Number(deductions) || 0,
      netSalary: Number(netSalary) || 0,
      status: status || 'Pending',
      paidDate: paidDate ? new Date(paidDate) : null,
    },
  });
  res.json(record);
};

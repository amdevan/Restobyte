import { Request, Response } from 'express';
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

function mapReservation(r: any): any {
  return {
    id: r.id,
    customerName: r.customer?.name || '',
    phone: r.customer?.phone || undefined,
    dateTime: r.reservationTime ? r.reservationTime.toISOString() : '',
    partySize: r.numberOfGuests,
    tableId: r.tableId || undefined,
    notes: r.notes || undefined,
    outletId: r.outletId,
    status: (r.status || 'PENDING').toLowerCase() as any,
    createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
  };
}

async function findOrCreateCustomer(outletId: string, customerName: string, phone?: string | null): Promise<string> {
  if (phone) {
    const existing = await prisma.customer.findFirst({
      where: {
        AND: [
          { OR: [{ phone }, { name: customerName }] },
          { outletId: { in: [outletId] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing.id;
  } else {
    const existing = await prisma.customer.findFirst({
      where: {
        AND: [
          { name: customerName },
          { outletId: { in: [outletId] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing.id;
  }

  const created = await prisma.customer.create({
    data: { name: customerName, phone: phone || null, outletId },
  });
  return created.id;
}

export const getReservations = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = req.query.outletId as string;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const reservations = await withRetry(() => prisma.reservation.findMany({
    where: { outletId },
    include: { customer: { select: { name: true, phone: true } }, table: true },
    orderBy: { reservationTime: 'desc' },
  }));
  res.json(reservations.map(mapReservation));
};

export const createReservation = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, customerName, phone, dateTime, partySize, tableId, notes, status } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!customerName) { res.status(400).json({ message: 'customerName is required' }); return; }
  if (!dateTime) { res.status(400).json({ message: 'dateTime is required' }); return; }
  if (!partySize && partySize !== 0) { res.status(400).json({ message: 'partySize is required' }); return; }
  if (!await validateOutletAccess(user, outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const customerId = await findOrCreateCustomer(outletId, customerName, phone || null);

  const reservation = await withRetry(() => prisma.reservation.create({
    data: {
      outletId,
      customerId,
      tableId: tableId || null,
      reservationTime: new Date(dateTime),
      numberOfGuests: Number(partySize),
      status: (status || 'PENDING').toUpperCase(),
      notes: notes || null,
    },
    include: { customer: { select: { name: true, phone: true } } },
  }));
  res.status(201).json(mapReservation(reservation));
};

export const updateReservation = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Reservation not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { customerName, phone, dateTime, partySize, tableId, notes, status } = req.body;
  const updateData: any = {};
  if (dateTime !== undefined) updateData.reservationTime = new Date(dateTime);
  if (partySize !== undefined) updateData.numberOfGuests = Number(partySize);
  if (tableId !== undefined) updateData.tableId = tableId || null;
  if (notes !== undefined) updateData.notes = notes || null;
  if (status !== undefined) updateData.status = String(status).toUpperCase();

  if (customerName !== undefined) {
    updateData.customerId = await findOrCreateCustomer(
      existing.outletId,
      customerName,
      phone !== undefined ? phone : null,
    );
  }

  const updated = await withRetry(() => prisma.reservation.update({
    where: { id },
    data: updateData,
    include: { customer: { select: { name: true, phone: true } } },
  }));
  res.json(mapReservation(updated));
};

export const deleteReservation = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Reservation not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await withRetry(() => prisma.reservation.delete({ where: { id } }));
  res.json({ success: true });
};

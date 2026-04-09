import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getMyProfile = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
    res.status(404).json({ message: 'Customer profile not found' });
    return;
  }

  res.json(customer);
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const { name, phone, address, billingAddress, dob, companyName, vatPan } = req.body;

  const customer = await prisma.customer.upsert({
    where: { userId: user.id },
    update: {
      name,
      phone,
      address,
      billingAddress,
      dob: dob ? new Date(dob) : null,
      companyName,
      vatPan,
    },
    create: {
      userId: user.id,
      name: name || user.username,
      email: user.username, // Assuming username is email
      phone,
      address,
      billingAddress,
      dob: dob ? new Date(dob) : null,
      companyName,
      vatPan,
      outletId: user.outletId
    }
  });

  res.json(customer);
};

export const getMyOrders = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
    res.json([]);
    return;
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' }
  });

  res.json(orders);
};

export const getMyReservations = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
    res.json([]);
    return;
  }

  const reservations = await prisma.reservation.findMany({
    where: { customerId: customer.id },
    include: { table: true },
    orderBy: { reservationTime: 'desc' }
  });

  res.json(reservations);
};

export const createReservation = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const { reservationTime, numberOfGuests, notes } = req.body;
  
  if (!reservationTime || !numberOfGuests) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
      res.status(400).json({ message: 'Please complete your profile first' });
      return;
  }

  const reservation = await prisma.reservation.create({
    data: {
      customerId: customer.id,
      outletId: user.outletId || 'outlet-1', // Fallback if not set
      reservationTime: new Date(reservationTime),
      numberOfGuests: Number(numberOfGuests),
      notes,
      status: 'PENDING'
    }
  });

  res.status(201).json(reservation);
};
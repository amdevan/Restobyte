import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';

export const listLeads = async (_req: Request, res: Response) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ leads });
};

export const createLead = async (req: Request, res: Response) => {
  const { name, email, phone, company, source, stage } = req.body;
  const lead = await prisma.lead.create({ data: { name, email, phone, company, source, stage } });
  res.status(201).json({ lead });
};

export const updateLead = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, email, phone, company, source, stage } = req.body;
  const lead = await prisma.lead.update({ where: { id }, data: { name, email, phone, company, source, stage } });
  res.json({ lead });
};

export const deleteLead = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.lead.delete({ where: { id } });
  res.status(204).send();
};

export const addNote = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { content } = req.body;
  const note = await prisma.leadNote.create({ data: { leadId: id, content } });
  res.status(201).json({ note });
};

export const getNotes = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const notes = await prisma.leadNote.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } });
  res.json({ notes });
};

export const convertLeadToTenant = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    res.status(404).json({ message: 'Lead not found' });
    return;
  }
  const tenant = await prisma.tenant.create({
    data: {
      name: lead.company || lead.name,
      phone: lead.phone || null,
      address: null,
      plan: 'Basic',
      subscriptionStatus: 'trialing',
      outlets: {
        create: [{ name: lead.company || lead.name, address: '', phone: lead.phone || null }]
      }
    }
  });
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('admin123', salt);
  const outlet = await prisma.outlet.findFirst({ where: { tenantId: tenant.id } });
  await prisma.user.create({
    data: {
      username: (lead.email && lead.email.split('@')[0]) || `admin_${tenant.id.slice(0, 6)}`,
      password,
      roleId: 'role-admin',
      tenantId: tenant.id,
      outletId: outlet?.id || null,
      isSuperAdmin: false,
    }
  });
  if (lead.email) {
    try {
      await sendWelcomeEmail(lead.email, lead.name || '');
    } catch (e) {
      // ignore email errors for conversion flow
    }
  }
  await prisma.lead.update({ where: { id }, data: { stage: 'Converted' } });
  res.json({ message: 'Converted to tenant', tenantId: tenant.id });
};

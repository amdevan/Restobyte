import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';

function weekStart(d: Date) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export const signupsPerWeek = async (req: Request, res: Response) => {
  const weeks = Number(req.query.weeks) || 8;
  const labels: string[] = [];
  const counts: number[] = [];
  const now = new Date();
  const start = weekStart(new Date(now));
  for (let i = weeks - 1; i >= 0; i--) {
    const from = new Date(start);
    from.setUTCDate(from.getUTCDate() - i * 7);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
    const count = await prisma.tenant.count({
      where: { createdAt: { gte: from, lt: to } },
    });
    labels.push(`${from.getUTCMonth() + 1}/${from.getUTCDate()}`);
    counts.push(count);
  }
  res.json({ labels, counts });
};

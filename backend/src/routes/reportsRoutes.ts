import { Router } from 'express';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Helper: sanitize filenames to prevent path traversal
function safeFilename(name: string, ext: string): string {
  const sanitized = String(name || 'report')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${sanitized}-${ts}.${ext}`;
}

// Helper: set standard download response headers
function setDownloadHeaders(res: Response, filename: string, contentType: string, contentLength?: number): void {
  // Encode filename for RFC 5987 compatibility (works with non-ASCII chars in all browsers)
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`);
  res.setHeader('Content-Type', contentType);
  if (contentLength !== undefined) {
    res.setHeader('Content-Length', String(contentLength));
  }
  // Prevent caching for sensitive reports
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

// Helper: ensure temp dir, return a unique temp file path
function createTempFile(prefix: string, ext: string): string {
  const tmp = fs.realpathSync(os.tmpdir());
  const name = `${prefix}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return path.join(tmp, name);
}

// Convert rows to CSV with UTF-8 BOM for Excel compatibility
function rowsToCsv(rows: Array<Record<string, unknown>>, columns?: Array<{ key: string; label: string }>): string {
  if (rows.length === 0 && !columns) return '\ufeff';
  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(rows[0] || {}).map(k => ({ key: k, label: k }));

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines: string[] = [];
  lines.push(cols.map(c => escape(c.label)).join(','));
  for (const row of rows) {
    lines.push(cols.map(c => escape(row[c.key])).join(','));
  }
  // UTF-8 BOM at start → Excel will open with correct encoding
  return '\ufeff' + lines.join('\r\n');
}

// ─────────────────────────────────────────────────────────────────────
// Stream a file from disk (for large reports to avoid buffering in memory)
// ─────────────────────────────────────────────────────────────────────
function streamTempFile(res: Response, tmpPath: string, filename: string, contentType: string): void {
  try {
    const stats = fs.statSync(tmpPath);
    setDownloadHeaders(res, filename, contentType, stats.size);
    const stream = fs.createReadStream(tmpPath, { highWaterMark: 256 * 1024 });
    stream.on('error', (err) => {
      console.error('[reports] stream error', err);
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
      if (!res.headersSent) res.status(500).json({ message: 'Stream failed' });
      else res.end();
    });
    stream.on('end', () => {
      // Cleanup temp after sending
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    });
    stream.pipe(res);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

// Helper: build outlet filter for the current user
async function getUserOutletIds(user: NonNullable<AuthRequest['user']>): Promise<string[] | null> {
  if (user.isSuperAdmin) return null; // null = no filter (all)
  const set = new Set<string>();
  if (user.outletId) set.add(String(user.outletId));
  if (Array.isArray((user as any).outletIds)) {
    for (const id of (user as any).outletIds) set.add(String(id));
  }
  return Array.from(set);
}

// =========================================================================
// ROUTES — authenticated
// =========================================================================
router.use(authenticate);

// ── Health / sample ──────────────────────────────────────────────
router.get('/ping', (_req, res) => {
  res.json({ ok: true, service: 'reports', time: new Date().toISOString() });
});

// ── Export orders as CSV ─────────────────────────────────────────
// For small result sets: buffer CSV in memory.
// For large result sets (>= LARGE_THRESHOLD rows): write temp file + stream.
router.get('/orders/csv', requirePermission('reports.view'), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user!;
    const outletIds = await getUserOutletIds(user);

    const LARGE_THRESHOLD = 5000;
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;

    const where: any = {};
    if (outletIds) where.outletId = { in: outletIds };
    if (from || to) {
      where.createdAt = {} as any;
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const total = await prisma.order.count({ where });

    const columns = [
      { key: 'id', label: 'Order ID' },
      { key: 'createdAt', label: 'Created At' },
      { key: 'outletId', label: 'Outlet ID' },
      { key: 'status', label: 'Status' },
      { key: 'total', label: 'Total' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerPhone', label: 'Customer Phone' },
      { key: 'tableNumber', label: 'Table' },
      { key: 'itemCount', label: 'Item Count' },
    ];

    const take = 50000;
    const queryArgs: any = {
      where,
      orderBy: { createdAt: 'desc' as const },
      take,
      include: { items: true, customer: true },
    };

    const makeRow = (o: any): Record<string, unknown> => {
      const sd: any = (o.saleData as any) || {};
      return {
        id: o.id,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : '',
        outletId: o.outletId,
        status: o.status,
        total: Number(o.total || 0),
        customerName: o.customer?.name || sd.customerName || '',
        customerPhone: o.customer?.phone || sd.customerPhone || '',
        tableNumber: o.tableNumber || sd.assignedTableName || '',
        itemCount: Array.isArray(o.items) ? o.items.length : 0,
      };
    };

    const filename = safeFilename('orders-export', 'csv');

    if (total < LARGE_THRESHOLD) {
      // Small report — generate in memory, send immediately
      const orders = await prisma.order.findMany(queryArgs);
      const csv = rowsToCsv(orders.map(makeRow), columns);
      setDownloadHeaders(res, filename, 'text/csv; charset=utf-8', Buffer.byteLength(csv, 'utf8'));
      res.status(200).send(csv);
      return;
    }

    // Large report — paginate into a temp file then stream
    const tmpPath = createTempFile('orders-report', 'csv');
    let firstBatch = true;
    let cursor: string | undefined;

    // First write BOM + header manually (streaming CSV writer)
    fs.appendFileSync(tmpPath, '\ufeff' + columns.map(c => c.label).join(',') + '\r\n');

    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    while (true) {
      const batch: any = await prisma.order.findMany({
        ...queryArgs,
        take: 2000,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (batch.length === 0) break;
      const chunk = batch.map((o: any) => {
        const row = makeRow(o);
        return columns.map(c => escape(row[c.key])).join(',');
      }).join('\r\n') + '\r\n';
      fs.appendFileSync(tmpPath, chunk, 'utf8');
      cursor = batch[batch.length - 1].id;
      firstBatch = false;
      if (batch.length < 2000) break;
    }

    streamTempFile(res, tmpPath, filename, 'text/csv; charset=utf-8');
  } catch (error: any) {
    console.error('[reports] orders/csv error:', error);
    res.status(500).json({ message: 'Failed to generate orders CSV report', detail: error?.message });
  }
});

// ── Export sales summary as CSV ──────────────────────────────────
router.get('/sales/summary/csv', requirePermission('reports.view'), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user!;
    const outletIds = await getUserOutletIds(user);

    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;

    const where: any = { status: { not: 'CANCELLED' } };
    if (outletIds) where.outletId = { in: outletIds };
    if (from || to) {
      where.createdAt = {} as any;
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true, createdAt: true, outletId: true, status: true, total: true,
        items: { select: { quantity: true, unitPrice: true, menuItem: { select: { name: true, categoryId: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = orders.map(o => ({
      date: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '',
      orderId: o.id,
      outletId: o.outletId,
      status: o.status,
      total: Number(o.total || 0),
      itemLines: o.items?.length || 0,
      units: (o.items || []).reduce((s, it: any) => s + Number(it.quantity || 0), 0),
    }));

    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'orderId', label: 'Order ID' },
      { key: 'outletId', label: 'Outlet ID' },
      { key: 'status', label: 'Status' },
      { key: 'total', label: 'Total' },
      { key: 'itemLines', label: 'Item Lines' },
      { key: 'units', label: 'Units Sold' },
    ];

    const csv = rowsToCsv(rows, columns);
    const filename = safeFilename('sales-summary', 'csv');
    setDownloadHeaders(res, filename, 'text/csv; charset=utf-8', Buffer.byteLength(csv, 'utf8'));
    res.status(200).send(csv);
  } catch (error: any) {
    console.error('[reports] sales/summary/csv error:', error);
    res.status(500).json({ message: 'Failed to generate sales CSV report', detail: error?.message });
  }
});

// ── Generic endpoint: simple JSON → CSV conversion (for client-side defined reports) ─
// Body: { rows, columns, filename }
// This mirrors client-side report export but produces a true CSV download via the backend
router.post('/convert/csv', requirePermission('reports.view'), async (req: Request, res: Response) => {
  try {
    const { rows, columns, filename: customName } = req.body || {};
    if (!Array.isArray(rows)) {
      res.status(400).json({ message: '"rows" array required in request body' });
      return;
    }
    const csv = rowsToCsv(rows as any, columns as any);
    const filename = safeFilename(customName || 'report', 'csv');
    setDownloadHeaders(res, filename, 'text/csv; charset=utf-8', Buffer.byteLength(csv, 'utf8'));
    res.status(200).send(csv);
  } catch (error: any) {
    console.error('[reports] convert/csv error:', error);
    res.status(500).json({ message: 'Failed to convert report to CSV', detail: error?.message });
  }
});

export default router;

import prisma from '../db/prisma.js';

export const buildInvoiceNumberFromPaymentId = (paymentId: string): string => `INV-${paymentId.slice(0, 8).toUpperCase()}`;

type InvoiceWriter = typeof prisma | any;

export const createInvoiceForPayment = async (db: InvoiceWriter, params: {
  tenantId: string;
  paymentId: string;
  amount: number;
  currencyCode?: string | null;
  status?: string | null;
  method?: string | null;
  notes?: string | null;
  issuedAt?: Date;
  paidAt?: Date | null;
}) => {
  return db.subscriptionInvoice.create({
    data: {
      invoiceNumber: buildInvoiceNumberFromPaymentId(params.paymentId),
      tenantId: params.tenantId,
      paymentId: params.paymentId,
      amount: Number(params.amount),
      currencyCode: params.currencyCode || 'NPR',
      status: params.status || 'paid',
      method: params.method || null,
      notes: params.notes || null,
      issuedAt: params.issuedAt || new Date(),
      paidAt: params.paidAt === undefined ? new Date() : params.paidAt,
    },
  });
};

export const backfillMissingInvoices = async (): Promise<number> => {
  const paymentsWithoutInvoices = await prisma.payment.findMany({
    where: {
      invoice: null,
    } as any,
    include: {
      tenant: {
        select: {
          currencyCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  let createdCount = 0;
  for (const payment of paymentsWithoutInvoices as any[]) {
    await createInvoiceForPayment(prisma as any, {
      tenantId: payment.tenantId,
      paymentId: payment.id,
      amount: payment.amount,
      currencyCode: payment.tenant?.currencyCode || 'NPR',
      status: payment.status,
      method: payment.method,
      notes: payment.notes,
      issuedAt: payment.createdAt,
      paidAt: payment.status === 'paid' ? payment.createdAt : null,
    });
    createdCount += 1;
  }

  return createdCount;
};

import { Router } from 'express';
import { getPublicSaasWebsiteContent } from '../controllers/saasWebsiteContentController.js';
import prisma from '../db/prisma.js';

const router = Router();

router.get('/saas-website-content', getPublicSaasWebsiteContent);

// TEMP: Public data export endpoint (remove after import)
router.get('/export-all', async (req, res) => {
  const exportData: Record<string, any[]> = {};
  const tables = ['Outlet', 'User', 'Role', 'Category', 'MenuItem', 'Variation', 'Table', 'Recipe', 'RecipeIngredient', 'StockItem', 'Customer', 'Order', 'OrderItem', 'Invoice', 'PaymentHistory', 'OutletAppData', 'UserAppData', 'GlobalAppData', 'Tenant', 'Printer', 'Reservation', 'Currency', 'PlanDefinition', 'Payment', 'SubscriptionInvoice', 'TenantLoginHistory', 'Attendance', 'Employee', 'Expense', 'ExpenseCategory', 'Lead', 'LeadNote', 'Supplier', 'SupplierPayment', 'Purchase', 'PurchaseItem', 'StockAdjustment', 'StockAdjustmentItem', 'StockEntry', 'StockEntryItem'];
  for (const table of tables) {
    try {
      const model = (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)];
      if (model && typeof model.findMany === 'function') {
        exportData[table] = await model.findMany();
      }
    } catch (err: any) {
      console.warn(`[export] Skipping table ${table}: ${err?.message}`);
    }
  }
  res.json(exportData);
});

router.post('/leads', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? (req.body as any) : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name) {
    res.status(400).json({ message: 'name is required' });
    return;
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: 'website-contact',
        stage: 'New',
      },
    });

    if (message) {
      await prisma.leadNote.create({
        data: {
          leadId: lead.id,
          content: message,
        },
      });
    }

    res.status(201).json({ leadId: lead.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit contact request' });
  }
});

export default router;

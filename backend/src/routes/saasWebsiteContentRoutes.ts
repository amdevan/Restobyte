import { Router } from 'express';
import { getPublicSaasWebsiteContent } from '../controllers/saasWebsiteContentController.js';
import prisma from '../db/prisma.js';

const router = Router();

router.get('/saas-website-content', getPublicSaasWebsiteContent);

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

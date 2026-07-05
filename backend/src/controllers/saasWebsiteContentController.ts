import { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const DEFAULT_ENV = process.env.SAAS_CMS_ENV || 'default';

const upgradeRemoveHeaderFeaturesNavLink = (content: any): { next: any; changed: boolean } => {
  if (!content || typeof content !== 'object') return { next: content, changed: false };
  const header = (content as any).header;
  if (!header || typeof header !== 'object') return { next: content, changed: false };
  const navLinksRaw = Array.isArray((header as any).navLinks) ? (header as any).navLinks : [];
  if (!Array.isArray(navLinksRaw) || navLinksRaw.length === 0) return { next: content, changed: false };

  const keep = [];
  let changed = false;
  for (const link of navLinksRaw) {
    const text = typeof link?.text === 'string' ? link.text.trim().toLowerCase() : '';
    const url = typeof link?.url === 'string' ? link.url.trim() : '';
    const isFeaturesLink = text === 'features' && (url === '/features' || url === '#features');
    if (isFeaturesLink) {
      changed = true;
      continue;
    }
    keep.push(link);
  }

  if (!changed) return { next: content, changed: false };
  return { next: { ...(content as any), header: { ...(header as any), navLinks: keep } }, changed: true };
};

const upgradeEnsureProductsInHeaderAndFooter = (content: any): { next: any; changed: boolean } => {
  if (!content || typeof content !== 'object') return { next: content, changed: false };

  let changed = false;
  const nextContent: any = { ...(content as any) };

  const headerRaw = nextContent.header && typeof nextContent.header === 'object' ? nextContent.header : null;
  if (headerRaw) {
    const navLinksRaw = Array.isArray(headerRaw.navLinks) ? headerRaw.navLinks : [];
    const hasProducts = navLinksRaw.some((l: any) => (typeof l?.url === 'string' ? l.url.trim() : '') === '/products');
    if (!hasProducts) {
      const productsLink = { id: 'nav-products', text: 'Products (Shop)', url: '/products' };
      const nextNav = navLinksRaw.slice();
      const pricingIndex = nextNav.findIndex((l: any) => (typeof l?.url === 'string' ? l.url.trim() : '') === '/pricing');
      if (pricingIndex >= 0) {
        nextNav.splice(pricingIndex + 1, 0, productsLink);
      } else {
        nextNav.push(productsLink);
      }
      nextContent.header = { ...headerRaw, navLinks: nextNav };
      changed = true;
    }
  }

  const footerRaw = nextContent.footer && typeof nextContent.footer === 'object' ? nextContent.footer : null;
  if (footerRaw) {
    const columnsRaw = Array.isArray(footerRaw.columns) ? footerRaw.columns : [];
    if (columnsRaw.length > 0) {
      const columns = columnsRaw.map((col: any) => {
        if (!col || typeof col !== 'object') return col;
        const title = typeof col.title === 'string' ? col.title.trim().toLowerCase() : '';
        if (title !== 'company') return col;
        const linksRaw = Array.isArray(col.links) ? col.links : [];
        const hasProducts = linksRaw.some((l: any) => (typeof l?.url === 'string' ? l.url.trim() : '') === '/products');
        if (hasProducts) return col;

        const nextLinks = linksRaw.slice();
        const productsLink = { id: 'l-products', text: 'Products (Shop)', url: '/products' };
        const featuresIndex = nextLinks.findIndex((l: any) => (typeof l?.url === 'string' ? l.url.trim() : '') === '/features');
        if (featuresIndex >= 0) {
          nextLinks.splice(featuresIndex + 1, 0, productsLink);
        } else {
          nextLinks.push(productsLink);
        }
        changed = true;
        return { ...col, links: nextLinks };
      });

      if (changed) {
        nextContent.footer = { ...footerRaw, columns };
      }
    }
  }

  if (!changed) return { next: content, changed: false };
  return { next: nextContent, changed: true };
};

const upgradeRemoveDuplicateFooterFeaturesLinks = (content: any): { next: any; changed: boolean } => {
  if (!content || typeof content !== 'object') return { next: content, changed: false };
  const footer = (content as any).footer;
  if (!footer || typeof footer !== 'object') return { next: content, changed: false };
  const columnsRaw = Array.isArray((footer as any).columns) ? (footer as any).columns : [];
  if (!Array.isArray(columnsRaw) || columnsRaw.length === 0) return { next: content, changed: false };

  let changed = false;
  const columns = columnsRaw.map((col: any) => {
    if (!col || typeof col !== 'object') return col;
    const linksRaw = Array.isArray((col as any).links) ? (col as any).links : [];
    if (!Array.isArray(linksRaw) || linksRaw.length === 0) return col;

    let seenFeature = false;
    const links = [];
    for (const link of linksRaw) {
      const text = typeof link?.text === 'string' ? link.text.trim().toLowerCase() : '';
      const url = typeof link?.url === 'string' ? link.url.trim() : '';
      const isFeature = text === 'features' && url === '/features';
      if (isFeature) {
        if (seenFeature) {
          changed = true;
          continue;
        }
        seenFeature = true;
      }
      links.push(link);
    }
    return { ...(col as any), links };
  });

  if (!changed) return { next: content, changed: false };
  return { next: { ...(content as any), footer: { ...(footer as any), columns } }, changed: true };
};

const upgradePricing = (content: any): { next: any; changed: boolean } => {
  if (!content || typeof content !== 'object') return { next: content, changed: false };
  const pricingRaw = Array.isArray((content as any).pricing) ? (content as any).pricing : [];
  if (!Array.isArray(pricingRaw) || pricingRaw.length === 0) return { next: content, changed: false };

  let changed = false;
  const pricing = pricingRaw.map((plan: any) => {
    if (!plan || typeof plan !== 'object') return plan;
    const hasIsFeatured = typeof (plan as any).isFeatured === 'boolean';
    const hasIsPopular = typeof (plan as any).isPopular === 'boolean';
    const periodValue =
      typeof (plan as any).period === 'string'
        ? (plan as any).period
        : typeof (plan as any).interval === 'string'
          ? (plan as any).interval
          : '';

    const needsIsFeatured = !hasIsFeatured && hasIsPopular;
    const needsPeriod = !periodValue || !periodValue.trim();

    if (!needsIsFeatured && !needsPeriod && !hasIsPopular) return plan;

    const nextPlan: any = { ...plan };
    if (needsIsFeatured) {
      nextPlan.isFeatured = Boolean((plan as any).isPopular);
      changed = true;
    }
    if (needsPeriod) {
      nextPlan.period = '/ month';
      changed = true;
    }
    if (hasIsPopular) {
      delete nextPlan.isPopular;
      changed = true;
    }
    if (typeof (plan as any).interval === 'string') {
      delete nextPlan.interval;
      changed = true;
    }
    return nextPlan;
  });

  if (!changed) return { next: content, changed: false };
  return { next: { ...(content as any), pricing }, changed: true };
};

const getDefaultProductsShop = () => ({
  brandLabel: 'RestoByte Shop',
  title: 'Hardware & Accessories',
  subtitle: 'High-performance hardware fully integrated with RestoByte software. Build your dream setup today.',
  whatsappNumber: '+9779843927360',
  ctaTitle: 'Need a full restaurant setup?',
  ctaSubtitle: 'Our experts can help you choose the right hardware for your specific floor plan and kitchen volume.',
  ctaButtonText: 'Request a Custom Quote',
  categories: ['Hardware', 'Accessories', 'Infrastructure'],
  products: [
    {
      id: 'shop-1',
      name: 'Pro POS Terminal v4',
      category: 'Hardware',
      price: 599,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400',
      icon: 'FiMonitor',
      isInStock: true,
      description: 'A durable, high-performance POS terminal built for fast billing and peak-hour reliability.',
      highlights: ['Touch display', 'Fast boot', 'Built for long shifts']
    },
    {
      id: 'shop-2',
      name: 'Thermal Receipt Printer',
      category: 'Accessories',
      price: 129,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=400',
      icon: 'FiPrinter',
      isInStock: true,
      description: 'High-speed thermal printer for crisp receipts with minimal maintenance.',
      highlights: ['Fast print', 'Low noise', 'Easy roll change']
    },
    {
      id: 'shop-3',
      name: 'Waiter Tablet Pro',
      category: 'Hardware',
      price: 249,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400',
      icon: 'FiTablet',
      isInStock: true,
      description: 'Lightweight tablet designed for quick order-taking and table-side operations.',
      highlights: ['Long battery', 'Rugged body', 'Fast Wi‑Fi']
    },
    {
      id: 'shop-4',
      name: 'Kitchen KDS Controller',
      category: 'Infrastructure',
      price: 189,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400',
      icon: 'FiCpu',
      isInStock: true,
      description: 'KDS controller to keep kitchen displays synced with orders in real time.',
      highlights: ['Realtime sync', 'Stable performance', 'Compact design']
    },
    {
      id: 'shop-5',
      name: 'Cash Drawer Pro',
      category: 'Accessories',
      price: 89,
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c02?auto=format&fit=crop&q=80&w=400',
      icon: 'FiDatabase',
      isInStock: true,
      description: 'Smooth, secure cash drawer compatible with standard POS setups.',
      highlights: ['Heavy duty', 'Secure lock', 'Easy integration']
    },
    {
      id: 'shop-6',
      name: 'Barcode Scanner v2',
      category: 'Accessories',
      price: 75,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400',
      icon: 'FiGrid',
      isInStock: true,
      description: 'Reliable scanner for quick item lookup and faster checkout workflows.',
      highlights: ['Quick scan', 'Comfort grip', 'Plug & play']
    }
  ]
});

const upgradeProductsShop = (content: any): { next: any; changed: boolean } => {
  if (!content || typeof content !== 'object') return { next: content, changed: false };
  const hasProductsShop = (content as any).productsShop && typeof (content as any).productsShop === 'object';
  if (hasProductsShop) return { next: content, changed: false };
  return { next: { ...(content as any), productsShop: getDefaultProductsShop() }, changed: true };
};

const getDefaultContent = () => ({
  sectionOrder: ['hero', 'trustedByLogos', 'statistics', 'cta', 'features', 'pricing', 'testimonials', 'blogPosts'],
  header: { 
    brandName: 'RestoByte',
    logoUrl: '/logo.png', 
    navLinks: [
      { id: '2', text: 'Pricing', url: '/pricing' },
      { id: '6', text: 'Products (Shop)', url: '/products' },
      { id: '3', text: 'Blogs', url: '/blogs' },
      { id: '4', text: 'About Us', url: '/about-us' },
      { id: '5', text: 'Contact', url: '/contact' }
    ] 
  },
  footer: { 
    brandTitle: 'RestoByte',
    brandDescription: 'Empower your restaurant with the modern tools it deserves. Join the community of successful restaurateurs today.',
    poweredByText: 'Powered by IT Relevant Pvt. Ltd',
    copyright: '©2026 Restobyte. All Rights Reserved.', 
    columns: [
      {
        id: 'col1',
        title: 'Company',
        links: [
          { id: 'l1', text: 'Home', url: '/' },
          { id: 'l2', text: 'Features', url: '/features' },
          { id: 'l3', text: 'Products (Shop)', url: '/products' },
          { id: 'l4', text: 'Pricing', url: '/pricing' },
          { id: 'l5', text: 'Blogs', url: '/blogs' },
          { id: 'l6', text: 'Career', url: '/career' },
          { id: 'l7', text: 'Contact', url: '/contact' }
        ]
      },
      {
        id: 'col2',
        title: 'Resources',
        links: [
          { id: 'l8', text: 'Help Center', url: '/contact' },
          { id: 'l9', text: 'Blog', url: '/blogs' },
          { id: 'l10', text: 'Security', url: '/privacy-policy' }
        ]
      }
    ], 
    socialLinks: [
      { id: 'social-fb', platform: 'Facebook', url: '#' },
      { id: 'social-twitter', platform: 'Twitter', url: '#' },
      { id: 'social-instagram', platform: 'Instagram', url: '#' }
    ] 
  },
  seo: { title: 'RestoByte | Intelligent Restaurant Operating System', description: 'The Intelligent Operating System for Modern Dining. From POS to kitchen display, reservations to staff management.', faviconUrl: '' },
  pages: [
    {
      id: 'p-about',
      title: 'About Us',
      slug: 'about-us',
      content: '<h2>Our Mission</h2><p>RestoByte was founded with a single goal: to empower restaurant owners with the technology they need to thrive in a digital-first world.</p><h3>Why Choose Us?</h3><ul><li>Industry-leading speed and reliability</li><li>Designed by restaurateurs, for restaurateurs</li><li>24/7 dedicated support team</li></ul>',
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=2070'
    },
    {
      id: 'p-privacy',
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy explains how we collect, use, and protect your data.</p><h3>Data Collection</h3><p>We only collect data that is essential for providing our services and improving your experience.</p>',
      imageUrl: ''
    },
    {
      id: 'p-terms',
      title: 'Terms of Service',
      slug: 'terms-of-service',
      content: '<h2>Terms of Service</h2><p>By using RestoByte, you agree to the following terms and conditions.</p><h3>Usage Agreement</h3><p>Our platform is intended for professional restaurant management use.</p>',
      imageUrl: ''
    },
    {
      id: 'p-contact',
      title: 'Contact',
      slug: 'contact',
      content: '<h2>Contact Our Team</h2><p>Need help with sales, onboarding, or support? Reach out to us and our team will get back to you quickly.</p><p>Email: support@restobyte.com</p><p>Phone: +977-0000000000</p>',
      imageUrl: ''
    },
    {
      id: 'p-career',
      title: 'Career',
      slug: 'career',
      content: '<h2>Join Our Team</h2><p>We are building the future of restaurant operations. If you love products, hospitality, and solving real business problems, we would love to hear from you.</p>',
      imageUrl: ''
    },
    {
      id: 'p-products',
      title: 'Products',
      slug: 'products',
      content: '<h2>Our Product Line</h2><p>Explore POS hardware, displays, printers, tablets, and software solutions built for restaurants of every size.</p>',
      imageUrl: ''
    }
  ],
  hero: {
    title: 'The Intelligent Operating System for Modern Dining',
    subtitle: 'From POS to kitchen display, reservations to staff management—RestoByte unifies your entire operation into one seamless, high-speed experience.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070'
  },
  trustedByLogos: [],
  statistics: [
    { label: 'Revenue Growth', value: '+32.5%' },
    { label: 'Active Guests', value: '142' },
    { label: 'Food Waste', value: '-18.4%' },
    { label: 'Profit Margin', value: '+12.2%' }
  ],
  features: [
    { id: '1', title: 'Order Management', description: 'Track dining, multi-waiter and takeaway orders with ease through intuitive interfaces.', icon: 'FiShoppingCart' },
    { id: '2', title: 'Menu & Pricing Control', description: 'Simply customize, edit, and sync your menu and prices with a unified management system.', icon: 'FiGrid' },
    { id: '3', title: 'Reservation System', description: 'Smart table reservations with automated confirmations and availability tracking.', icon: 'FiCalendar' },
    { id: '4', title: 'Staff Management', description: 'Schedule shifts, track performance, and manage staff permissions across all locations.', icon: 'FiUsers' },
    { id: '5', title: 'Sales Reports & Insights', description: 'Get real-time hours performance insights to make smarter business decisions.', icon: 'FiBarChart2' }
  ],
  cta: { 
    title: 'Manage Projects Better Start Now', 
    subtitle: 'Elevate your restaurant management experience with RestoByte. Get started today and see the difference.', 
    buttonText: 'Download App' 
  },
  pricing: [
    { id: 'p1', name: 'Essential', price: '29', period: '/ month', features: ['Live POS System', 'Table Management', 'Daily Sales Reports'], isFeatured: false },
    { id: 'p2', name: 'Growth', price: '79', period: '/ month', features: ['Everything in Essential', 'Inventory Tracking', 'Staff Scheduling'], isFeatured: true },
    { id: 'p3', name: 'Enterprise', price: '149', period: '/ month', features: ['Everything in Growth', 'Multi-location Control', 'API Access'], isFeatured: false }
  ],
  productsShop: getDefaultProductsShop(),
  testimonials: [
    { id: 't1', storeName: 'Bistro 101', result: 'Sarah Jenkins, Owner', description: 'This system completely changed our Friday nights. The kitchen is quieter, orders are accurate, and we\'re turning tables 15% faster.', imageUrl: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 't2', storeName: 'Urban Eats', result: 'Mike Ross, GM', description: 'Finally, software that doesn\'t feel like it was built in the 90s. The inventory tracking alone saved us $2k in our first month.', imageUrl: 'https://i.pravatar.cc/150?u=mike' }
  ],
  blogPosts: [
    {
      id: 'b1',
      title: 'How to Optimize Your Restaurant Kitchen Flow',
      category: 'Operations',
      excerpt: 'Efficiency in the kitchen is the heartbeat of any successful restaurant. Discover 5 key strategies to reduce wait times...',
      date: '2025-03-20',
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2070'
    },
    {
      id: 'b2',
      title: 'The Future of Dining: AI in the Restaurant Industry',
      category: 'Technology',
      excerpt: 'From predictive ordering to personalized guest experiences, AI is transforming how we eat out. Are you ready?',
      date: '2025-03-15',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2070'
    }
  ]
});

export const getPublicSaasWebsiteContent = async (req: Request, res: Response) => {
  const env = (req.query.env as string) || DEFAULT_ENV;
  try {
    const record = await prisma.saasWebsiteContent.findUnique({ where: { env } });
    if (!record) {
      const created = await prisma.saasWebsiteContent.create({
        data: { env, content: getDefaultContent() }
      });
      res.json({ env: created.env, content: created.content, updatedAt: created.updatedAt });
      return;
    }
    const p = upgradePricing(record.content);
    const ps = upgradeProductsShop(p.next);
    const h = upgradeRemoveHeaderFeaturesNavLink(ps.next);
    const pr = upgradeEnsureProductsInHeaderAndFooter(h.next);
    const f = upgradeRemoveDuplicateFooterFeaturesLinks(pr.next);
    const next = f.next;
    const changed = p.changed || ps.changed || h.changed || pr.changed || f.changed;
    if (changed) {
      const updated = await prisma.saasWebsiteContent.update({
        where: { env: record.env },
        data: { content: next },
      });
      res.json({ env: updated.env, content: updated.content, updatedAt: updated.updatedAt });
      return;
    }
    res.json({ env: record.env, content: next, updatedAt: record.updatedAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load SaaS website content' });
  }
};

export const getAdminSaasWebsiteContent = async (req: Request, res: Response) => {
  const env = (req.query.env as string) || DEFAULT_ENV;
  try {
    const record = await prisma.saasWebsiteContent.findUnique({ where: { env } });
    if (!record) {
      const created = await prisma.saasWebsiteContent.create({
        data: { env, content: getDefaultContent() }
      });
      res.json({ env: created.env, content: created.content, updatedAt: created.updatedAt });
      return;
    }
    const p = upgradePricing(record.content);
    const ps = upgradeProductsShop(p.next);
    const h = upgradeRemoveHeaderFeaturesNavLink(ps.next);
    const pr = upgradeEnsureProductsInHeaderAndFooter(h.next);
    const f = upgradeRemoveDuplicateFooterFeaturesLinks(pr.next);
    const next = f.next;
    const changed = p.changed || ps.changed || h.changed || pr.changed || f.changed;
    if (changed) {
      const updated = await prisma.saasWebsiteContent.update({
        where: { env: record.env },
        data: { content: next },
      });
      res.json({ env: updated.env, content: updated.content, updatedAt: updated.updatedAt });
      return;
    }
    res.json({ env: record.env, content: next, updatedAt: record.updatedAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load SaaS website content' });
  }
};

export const updateAdminSaasWebsiteContent = async (req: Request, res: Response) => {
  const env = (req.query.env as string) || DEFAULT_ENV;
  const body = (req as AuthRequest).body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ message: 'Invalid content payload' });
    return;
  }

  try {
    const record = await prisma.saasWebsiteContent.upsert({
      where: { env },
      create: { env, content: body },
      update: { content: body }
    });

    res.json({ env: record.env, content: record.content, updatedAt: record.updatedAt });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update SaaS website content' });
  }
};

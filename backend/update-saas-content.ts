
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getDefaultContent = () => ({
  sectionOrder: ['hero', 'trustedByLogos', 'statistics', 'cta', 'features', 'pricing', 'testimonials', 'blogPosts'],
  header: { 
    logoUrl: '', 
    navLinks: [
      { 
        id: '1', 
        text: 'Features', 
        url: '/features',
        subLinks: [
          { id: 's1', text: 'Order Management', url: '/features#orders' },
          { id: 's2', text: 'Inventory Tracking', url: '/features#inventory' },
          { id: 's3', text: 'QR Ordering', url: '/features#qr' },
          { id: 's4', text: 'Staff Management', url: '/features#staff' }
        ]
      },
      { id: '2', text: 'Pricing', url: '/pricing' },
      { id: '3', text: 'Blogs', url: '/blogs' },
      { id: '4', text: 'About Us', url: '/about-us' },
      { id: '5', text: 'Contact', url: '/contact' }
    ] 
  },
  footer: { 
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
      { platform: 'Facebook', url: '#' },
      { platform: 'Twitter', url: '#' },
      { platform: 'Instagram', url: '#' }
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
    { id: 'p1', name: 'Essential', price: '29', features: ['Live POS System', 'Table Management', 'Daily Sales Reports'], isPopular: false },
    { id: 'p2', name: 'Growth', price: '79', features: ['Everything in Essential', 'Inventory Tracking', 'Staff Scheduling'], isPopular: true },
    { id: 'p3', name: 'Enterprise', price: '149', features: ['Everything in Growth', 'Multi-location Control', 'API Access'], isPopular: false }
  ],
  testimonials: [
    { id: 't1', name: 'Sarah Jenkins', role: 'Owner of Bistro 101', content: 'This system completely changed our Friday nights. The kitchen is quieter, orders are accurate, and we\'re turning tables 15% faster.', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', rating: 5 },
    { id: 't2', name: 'Mike Ross', role: 'GM at Urban Eats', content: 'Finally, software that doesn\'t feel like it was built in the 90s. The inventory tracking alone saved us $2k in our first month.', avatarUrl: 'https://i.pravatar.cc/150?u=mike', rating: 5 }
  ],
  blogPosts: [
    {
      id: 'b1',
      title: 'How to Optimize Your Restaurant Kitchen Flow',
      excerpt: 'Efficiency in the kitchen is the heartbeat of any successful restaurant. Discover 5 key strategies to reduce wait times...',
      date: '2025-03-20',
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2070',
      author: 'Chef Antonio'
    },
    {
      id: 'b2',
      title: 'The Future of Dining: AI in the Restaurant Industry',
      excerpt: 'From predictive ordering to personalized guest experiences, AI is transforming how we eat out. Are you ready?',
      date: '2025-03-15',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2070',
      author: 'Tech Guru'
    }
  ]
});

async function main() {
  const env = 'default';
  console.log(`Updating SaaS content for env: ${env}...`);
  
  const updated = await prisma.saasWebsiteContent.upsert({
    where: { env },
    update: {
      content: getDefaultContent() as any
    },
    create: {
      env,
      content: getDefaultContent() as any
    }
  });
  
  console.log('Successfully updated SaaS website content in database.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

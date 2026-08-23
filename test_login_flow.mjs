import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const context = await browser.newContext();
const page = await context.newPage();

// Enable console logging
page.on('console', msg => console.log(`[console.${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.error('[pageerror]', err.message));

console.log('=== Starting login flow test ===');
console.log('Step 1: Navigate to login page');
await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
console.log('  Current URL:', page.url());

// Check what login page is shown
const pageTitle = await page.title();
console.log('  Page title:', pageTitle);
const heading = await page.$('h1, h2, h3').then(el => el?.textContent()).catch(() => 'N/A');
console.log('  Heading:', heading);

// Check if we're on SaaS login page or restaurant login page
const isSaaSLogin = await page.$('text=RestoByte SaaS Admin');
const isRestaurantLogin = await page.$('text=Welcome back');
console.log('  Is SaaS login page:', !!isSaaSLogin);
console.log('  Is Restaurant login page:', !!isRestaurantLogin);

console.log('Step 2: Fill in login credentials');
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'admin123');

console.log('Step 3: Click Sign In');
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(e => console.log('  Navigation timeout:', e.message)),
]);
await page.click('button[type="submit"]');

// Wait a bit for any navigation
await page.waitForTimeout(3000);

console.log('Step 4: Check final URL');
console.log('  Current URL:', page.url());

// Check for localStorage auth data
const authUser = await page.evaluate(() => localStorage.getItem('authUser'));
if (authUser) {
  const user = JSON.parse(authUser);
  console.log('  Auth user:', JSON.stringify({
    username: user.username,
    isSuperAdmin: user.isSuperAdmin,
    roleId: user.roleId
  }));
} else {
  console.log('  No authUser in localStorage');
}

// Check what page content is shown
const finalHeading = await page.$('h1, h2, h3, h4').then(el => el?.textContent()).catch(() => 'N/A');
console.log('  Final heading:', finalHeading);

const isSaaSPage = await page.$('text=RestoByte SaaS Admin, text=Manage Tenants, text=Manage Plans');
const isRestaurantDashboard = await page.$('text=Dashboard, text=POS, text=Point of Sale');
console.log('  Is on SaaS page:', !!isSaaSPage);
console.log('  Is on restaurant dashboard:', !!isRestaurantDashboard);

// Check for SaaS login page
const isSaaSLoginPage = await page.$('text=Sign in to manage the platform');
console.log('  Is on SaaS login page:', !!isSaaSLoginPage);

await browser.close();
console.log('=== Test complete ===');

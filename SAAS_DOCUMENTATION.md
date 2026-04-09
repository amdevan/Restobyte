# Restobyte SaaS Platform Documentation

## 1. Overview
Restobyte has been upgraded to a multi-tenant SaaS (Software as a Service) platform. This allows a Super Admin to manage multiple restaurant tenants, subscription plans, and the platform's marketing website content from a centralized dashboard.

## 2. Architecture

### 2.1 Domain-Based Routing
The application uses domain detection to serve different experiences:
- **SaaS Admin Panel**: Accessible via `admin.localhost` (or `admin.yourdomain.com`).
  - Routes: `/dashboard`, `/tenants`, `/plans`, `/cms/*`, `/settings`.
- **Tenant/Main App**: Accessible via `localhost` or `app.yourdomain.com`.
  - Routes: `/app/home`, `/pos`, etc.
- **Subdomain Routing Logic**:
  - Implemented in `src/utils/domain.ts` via `isSaaSDomain()`.
  - `App.tsx` conditionally renders `SaaSPanelRoutes` or standard `AppRoutes` based on the domain.

### 2.2 Tech Stack
- **Frontend**: React, TypeScript, Vite.
- **Styling**: Tailwind CSS.
- **State Management**: React Context (`useRestaurantData`) - acting as a client-side database for this demo.
- **Routing**: `react-router-dom` (HashRouter).

### 2.3 Key Directories
- `src/pages/saas/`: Contains all SaaS-specific pages.
  - `cms/`: Content Management System pages (Home, Blogs, SEO).
  - `auth/`: SaaS-specific login.
- `src/components/saas/`: Reusable SaaS UI components (Modals, Forms).
- `src/utils/domain.ts`: Domain detection utilities.

## 3. Functionalities & Responsibilities

### 3.1 Super Admin Capabilities
The Super Admin (SaaS Owner) has full control over the platform:

#### A. Dashboard (`/dashboard`)
- **Responsibility**: Provide high-level metrics.
- **Features**:
  - Total Tenants count.
  - Monthly Recurring Revenue (MRR) calculation.
  - Active Subscriptions tracking.
  - Recent Tenant Signups list.

#### B. Tenant Management (`/tenants`)
- **Responsibility**: Onboard and manage restaurant clients.
- **Features**:
  - **List Tenants**: View all registered restaurants.
  - **Add Tenant**: Create a new restaurant outlet + admin user.
  - **Edit Tenant**: Update details, subscription status, and plan.
  - **Suspend/Activate**: Toggle tenant access.

#### C. Plan Management (`/plans`)
- **Responsibility**: Define subscription tiers.
- **Features**:
  - Create, Edit, Delete plans.
  - Set pricing, billing period (monthly/yearly), and feature lists.

#### D. Website CMS (`/cms/*`)
- **Responsibility**: Manage the public-facing marketing website content.
- **Features**:
  - **Home Page**: Edit Hero section, Features, Pricing display, Testimonials.
  - **Blogs**: Create and manage blog posts.
  - **SEO**: Configure global SEO settings.
  - **Header/Footer**: Manage navigation links.

#### E. Settings (`/settings`)
- **Responsibility**: Platform-wide configuration.
- **Features**:
  - Payment Gateway integration (Stripe keys).
  - General platform settings.

### 3.2 Tenant Capabilities
Each restaurant tenant gets:
- **Dedicated Admin Account**: Created during onboarding.
- **Restaurant Management**: Full access to POS, Inventory, Menu, Employees, etc.
- **Data Isolation**: Data is logically separated by `outletId`.

## 4. Data Model (Simulated)
The `useRestaurantData` hook manages the following SaaS entities:
- **Outlets**: Represents tenants.
- **Users**: Admin users linked to outlets.
- **Plans**: Subscription tiers.
- **SaasWebsiteContent**: CMS data.
- **SaasSettings**: Platform configuration.

## 5. Security & Access Control
- **Authentication**: `useAuth` hook manages login state.
- **Role-Based Access**:
  - `isSuperAdmin` flag distinguishes SaaS Admins from Tenant Admins.
  - SaaS routes are protected and only accessible to Super Admins.
  - Tenants are redirected to the main app interface.

## 6. How to Run
1. **Start Development Server**: `npm run dev`
2. **Access SaaS Admin**: Go to `http://admin.localhost:5173/` (or your local port).
   - **Credentials**: `admin` / `password` (Default Super Admin).
3. **Access Tenant App**: Go to `http://localhost:5173/`.
   - **Credentials**: Use tenant credentials created in the Admin Panel.

## 7. Future Roadmap
- **Backend Integration**: Move from `useRestaurantData` to a real Node.js/PostgreSQL backend.
- **Payment Processing**: Real integration with Stripe/PayPal.
- **Custom Domains**: Allow tenants to map their own domains (e.g., `restaurant.com`).

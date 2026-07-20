



import React from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigationType, useNavigate } from 'react-router-dom';

import { RestaurantDataProvider, useRestaurantData } from './hooks/useRestaurantData';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MobileProvider from './hooks/useMobileApp';
import { isSaaSDomain } from '@/utils/domain';

import RestaurantLayout from './components/layout/RestaurantLayout';
import Spinner from './components/common/Spinner';
import FeatureDisabledPage from './components/common/FeatureDisabledPage';
import NativeAuthScreen from './components/auth/NativeAuthScreen';
import PublicLayout from '@/components/public/PublicLayout';
import { isNative } from '@/utils/capacitorService';
import PublicHomePage from '@/pages/public/PublicHomePage';
import PublicMenuPage from '@/pages/public/PublicMenuPage';
import PublicAboutPage from '@/pages/public/PublicAboutPage';
import PublicInvoicePage from '@/pages/public/PublicInvoicePage';
const PublicContactPage = React.lazy(() => import('./pages/public/PublicContactPage'));
const SaaSBlogsPage = React.lazy(() => import('./pages/public/SaaSBlogsPage'));
const SaaSContactPage = React.lazy(() => import('./pages/public/SaaSContactPage'));
const SaaSFeaturesPage = React.lazy(() => import('./pages/public/SaaSFeaturesPage'));
const SaaSPricingPage = React.lazy(() => import('./pages/public/SaaSPricingPage'));
const SaaSProductsShopPage = React.lazy(() => import('./pages/public/SaaSProductsShopPage'));
const DynamicSaaSPage = React.lazy(() => import('./pages/public/DynamicSaaSPage'));
const PublicLoginPage = React.lazy(() => import('./pages/public/PublicLoginPage'));
import PublicRegisterPage from '@/pages/public/PublicRegisterPage';
const CustomerLayout = React.lazy(() => import('./components/customer/CustomerLayout'));
const CustomerDashboardPage = React.lazy(() => import('./pages/customer/CustomerDashboardPage'));
const CustomerProfilePage = React.lazy(() => import('./pages/customer/CustomerProfilePage'));
const CustomerOrdersPage = React.lazy(() => import('./pages/customer/CustomerOrdersPage'));
const CustomerReservationsPage = React.lazy(() => import('./pages/customer/CustomerReservationsPage'));
const CustomerSettingsPage = React.lazy(() => import('./pages/customer/CustomerSettingsPage'));

const SaaSLayout = React.lazy(() => import('./pages/saas/SaaSLayout'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const LandingPage = React.lazy(() => import('./pages/public/LandingPage'));
// Removed RestaurantWebsitePage as it's replaced by PublicLayout and sub-pages


// SaaS Pages
const SaaSDashboardPage = React.lazy(() => import('./pages/saas/SaaSDashboardPage'));
const ManageTenantsPage = React.lazy(() => import('./pages/saas/ManageTenantsPage'));
const TenantDetailsPage = React.lazy(() => import('./pages/saas/TenantDetailsPage'));
const ManagePlansPage = React.lazy(() => import('./pages/saas/ManagePlansPage'));
const SaaSSettingsPage = React.lazy(() => import('./pages/saas/SaaSSettingsPage'));
const SaaSLoginPage = React.lazy(() => import('./pages/saas/auth/SaaSLoginPage'));
const WebsiteCMSPage = React.lazy(() => import('./pages/saas/WebsiteCMSPage'));
const CRMLeadsPage = React.lazy(() => import('./pages/saas/CRMLeadsPage'));

// New SaaS CMS Pages
const HomePageContentPage = React.lazy(() => import('./pages/saas/cms/HomePageContentPage'));
const HeaderFooterPage = React.lazy(() => import('./pages/saas/cms/HeaderFooterPage'));
const PagesPage = React.lazy(() => import('./pages/saas/cms/PagesPage'));
const BlogsPage = React.lazy(() => import('./pages/saas/cms/BlogsPage'));
const SeoPage = React.lazy(() => import('./pages/saas/cms/SeoPage'));


// Restaurant Pages (import all existing pages)
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const MenuPage = React.lazy(() => import('./pages/MenuPage'));
const TablesPage = React.lazy(() => import('./pages/TablesPage'));
const ReservationsPage = React.lazy(() => import('./pages/ReservationsPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const PosPage = React.lazy(() => import('./pages/PosPage'));
const RunningOrdersPage = React.lazy(() => import('./pages/RunningOrdersPage'));
const AddFoodMenuCategoryActualPage = React.lazy(() => import('./pages/item/AddFoodMenuCategoryPage'));
const ListFoodMenuCategoryActualPage = React.lazy(() => import('./pages/item/ListFoodMenuCategoryPage'));
const ListPreMadeFoodActualPage = React.lazy(() => import('./pages/item/ListPreMadeFoodPage'));
const ViewStockLevelsActualPage = React.lazy(() => import('./pages/stock/ViewStockLevelsPage'));
const AddStockEntryActualPage = React.lazy(() => import('./pages/stock/AddStockEntryPage'));
const StockAdjustmentsActualPage = React.lazy(() => import('./pages/stock/StockAdjustmentsPage'));
const ManageSuppliersActualPage = React.lazy(() => import('./pages/stock/ManageSuppliersPage'));
const ManageAreasFloorsPage = React.lazy(() => import('./pages/settings/ManageAreasFloorsPage'));
const ManageKitchensPage = React.lazy(() => import('./pages/settings/ManageKitchensPage'));
const ManagePrintersPage = React.lazy(() => import('./pages/settings/ManagePrintersPage'));
const ManageCountersPage = React.lazy(() => import('./pages/settings/ManageCountersPage'));
const ManageTablesSettingsPage = React.lazy(() => import('./pages/settings/ManageTablesSettingsPage'));
const ManageWaitersPage = React.lazy(() => import('./pages/settings/ManageWaitersPage'));
const ManageCurrenciesPage = React.lazy(() => import('./pages/settings/ManageCurrenciesPage'));
const LowStockReportActualPage = React.lazy(() => import('./pages/stock/LowStockReportPage'));
const SalesHistoryPage = React.lazy(() => import('./pages/SalesHistoryPage'));
const CustomerPage = React.lazy(() => import('./pages/CustomerPage'));
const CustomerDetailPage = React.lazy(() => import('./pages/CustomerDetailPage'));
const CustomerDueReceivePageActual = React.lazy(() => import('./pages/CustomerDueReceivePage'));
const ActualPurchasePage = React.lazy(() => import('./pages/PurchasePage'));
const AddPurchaseActualPage = React.lazy(() => import('./pages/purchase/AddPurchasePage'));
const ActualSupplierDuePaymentPage = React.lazy(() => import('./pages/SupplierDuePaymentPage'));
const FunctionalExpensePage = React.lazy(() => import('./pages/ExpensePage'));
const ManageExpenseCategoriesPage = React.lazy(() => import('./pages/settings/ManageExpenseCategoriesPage'));
const FunctionalWastePage = React.lazy(() => import('./pages/WastePage'));
const FunctionalEmployeesPage = React.lazy(() => import('./pages/EmployeesPage'));
const FunctionalAttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const FunctionalPayrollPage = React.lazy(() => import('./pages/PayrollPage'));
const DailySummaryReportActualPage = React.lazy(() => import('./pages/reports/DailySummaryReportPage'));
const ManageDenominationsPage = React.lazy(() => import('./pages/settings/ManageDenominationsPage'));
const KitchenDisplayPage = React.lazy(() => import('./pages/panel/KitchenDisplayPage'));
const CustomerDisplayPage = React.lazy(() => import('./pages/panel/CustomerDisplayPage'));
const OutletSettingPage = React.lazy(() => import('./pages/placeholders/OutletSettingPage'));
const ProductionPage = React.lazy(() => import('./pages/placeholders/ProductionPage'));
const AccountAndUserPage = React.lazy(() => import('./pages/placeholders/AccountAndUserPage'));
const SendSmsPage = React.lazy(() => import('./pages/placeholders/SendSmsPage'));
const AppSettingsPage = React.lazy(() => import('./pages/settings/AppSettingsPage'));
const WhiteLabelPage = React.lazy(() => import('./pages/placeholders/WhiteLabelPage'));
const TaxSettingPage = React.lazy(() => import('./pages/placeholders/TaxSettingPage'));
const ListPaymentMethodPage = React.lazy(() => import('./pages/placeholders/ListPaymentMethodPage'));
const ListDeliveryPartnerPage = React.lazy(() => import('./pages/settings/ListDeliveryPartnerPage'));
const FloorAreaPlanDesignPage = React.lazy(() => import('./pages/placeholders/FloorAreaPlanDesignPage'));
const EnableDisableSelfOrderPage = React.lazy(() => import('./pages/self-order/EnableDisableSelfOrderPage'));
const EnableDisableReservationOrderPage = React.lazy(() => import('./pages/reservation-settings/EnableDisableReservationOrderPage'));
const ReservationOrderReceivingUserPage = React.lazy(() => import('./pages/reservation-settings/ReservationOrderReceivingUserPage'));
const EnableDisableReservationPage = React.lazy(() => import('./pages/reservation-settings/EnableDisableReservationPage'));
const TableQrCodeGeneratorPage = React.lazy(() => import('./pages/self-order/TableQrCodeGeneratorPage'));
const ReportDashboardPage = React.lazy(() => import('./pages/reports/ReportDashboardPage'));
const KitchenPerformanceReportPage = React.lazy(() => import('./pages/reports/KitchenPerformanceReportPage'));
const ProductAnalysisReportPage = React.lazy(() => import('./pages/reports/ProductAnalysisReportPage'));
const DailySaleReportPage = React.lazy(() => import('./pages/reports/DailySaleReportPage'));
const ConsumptionReportPage = React.lazy(() => import('./pages/reports/ConsumptionReportPage'));
const SupplierLedgerReportPage = React.lazy(() => import('./pages/reports/SupplierLedgerReportPage'));
const CustomerLedgerReportPage = React.lazy(() => import('./pages/reports/CustomerLedgerReportPage'));
const WaiterTipsReportPage = React.lazy(() => import('./pages/reports/WaiterTipsReportPage'));
const AuditLogReportPage = React.lazy(() => import('./pages/reports/AuditLogReportPage'));
const AvailableLoyaltyPointReportPage = React.lazy(() => import('./pages/reports/AvailableLoyaltyPointReportPage'));
const UsageLoyaltyPointReportPage = React.lazy(() => import('./pages/reports/UsageLoyaltyPointReportPage'));
const ProductionReportPage = React.lazy(() => import('./pages/reports/ProductionReportPage'));
const AttendanceReportPage = React.lazy(() => import('./pages/reports/AttendanceReportPage'));
const SupplierDueReportPage = React.lazy(() => import('./pages/reports/SupplierDueReportPage'));
const CustomerDueReportPage = React.lazy(() => import('./pages/reports/CustomerDueReportPage'));
const PurchaseReportPage = React.lazy(() => import('./pages/reports/PurchaseReportPage'));
const ExpenseReportPage = React.lazy(() => import('./pages/reports/ExpenseReportPage'));
const WasteReportPage = React.lazy(() => import('./pages/reports/WasteReportPage'));
const DetailedSaleReportPage = React.lazy(() => import('./pages/reports/DetailedSaleReportPage'));
const FoodMenuSaleByCategoryPage = React.lazy(() => import('./pages/reports/FoodMenuSaleByCategoryPage'));
const FoodSaleReportPage = React.lazy(() => import('./pages/reports/FoodSaleReportPage'));
const ProfitLossReportPage = React.lazy(() => import('./pages/reports/ProfitLossReportPage'));
const RegisterReportPage = React.lazy(() => import('./pages/reports/RegisterReportPage'));
const StockReportPage = React.lazy(() => import('./pages/reports/StockReportPage'));
const TaxReportPage = React.lazy(() => import('./pages/reports/TaxReportPage'));
const ZReportPage = React.lazy(() => import('./pages/reports/ZReportPage'));
const OrderEnableDisablePage = React.lazy(() => import('./pages/website-settings/OrderEnableDisablePage'));
const OrderReceivingUserPage = React.lazy(() => import('./pages/website-settings/OrderReceivingUserPage'));
const WebsiteWhiteLabelPage = React.lazy(() => import('./pages/website-settings/WebsiteWhiteLabelPage'));
const HomepageContentPage = React.lazy(() => import('./pages/website-settings/HomepageContentPage'));
const AddPhotoPage = React.lazy(() => import('./pages/website-settings/AddPhotoPage'));
const ListPhotoPage = React.lazy(() => import('./pages/website-settings/ListPhotoPage'));
const SocialMediaPage = React.lazy(() => import('./pages/website-settings/SocialMediaPage'));
const AvailableOnlineFoodsPage = React.lazy(() => import('./pages/website-settings/AvailableOnlineFoodsPage'));
const AboutUsContentPage = React.lazy(() => import('./pages/website-settings/AboutUsContentPage'));
const ContactUsContentPage = React.lazy(() => import('./pages/website-settings/ContactUsContentPage'));
const ContactListPage = React.lazy(() => import('./pages/website-settings/ContactListPage'));
const CommonMenuPage = React.lazy(() => import('./pages/website-settings/CommonMenuPage'));
const SocialLoginSettingPage = React.lazy(() => import('./pages/website-settings/SocialLoginSettingPage'));
const EmailSettingPage = React.lazy(() => import('./pages/website-settings/EmailSettingPage'));
const PaymentSettingPage = React.lazy(() => import('./pages/website-settings/PaymentSettingPage'));
const AccessDataPage = React.lazy(() => import('./pages/website-settings/AccessDataPage'));
const WhatsappOrderMenuPage = React.lazy(() => import('./pages/whatsapp/WhatsappOrderMenuPage'));
const WhatsappSettingsPage = React.lazy(() => import('./pages/whatsapp/WhatsappSettingsPage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
const ManageAddonsPage = React.lazy(() => import('./pages/item/ManageAddonsPage'));
const MobileScanner = React.lazy(() => import('./components/MobileScanner'));
const SoundSettingsPage = React.lazy(() => import('./pages/settings/SoundSettingsPage'));
// Website Settings: AI Website Builder
const AiWebsiteBuilderPage = React.lazy(() => import('./pages/website-settings/AiWebsiteBuilderPage'));


const AuthAwareLanding: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) {
        return <div className="flex h-screen w-screen items-center justify-center bg-gray-100"><Spinner size="lg" /></div>;
    }
    if (isAuthenticated) {
        return <Navigate to={user?.isSuperAdmin ? "/saas/dashboard" : "/app/dashboard"} replace />;
    }
    // On the native mobile app, skip the marketing landing page and go straight to login.
    // Web visitors (and dev-preview via ?native=1) still see LandingPage below.
    if (isNative) {
        return <Navigate to="/login" replace />;
    }
    return <LandingPage />;
}

const AuthSwitchWrapper: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
    const navigate = useNavigate();
    return (
        <NativeAuthScreen>
            {mode === 'login' ? (
                <LoginPage onSwitchToRegister={() => navigate('/register')} />
            ) : (
                <RegisterPage onSwitchToLogin={() => navigate('/login')} />
            )}
        </NativeAuthScreen>
    );
}

const ProtectedRoute: React.FC<{ children: React.ReactElement; requiredPermissions?: string[] }> = ({ children, requiredPermissions }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const hasPermission = React.useCallback(() => {
        if (!user) return false;
        if (user.isSuperAdmin || user.roleId === 'role-admin') return true;
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        const userPermissions = user.permissions || [];
        if (userPermissions.includes('*')) return true;
        return requiredPermissions.some(perm => userPermissions.includes(perm));
    }, [user, requiredPermissions]);

    React.useEffect(() => {
        if (!hasPermission()) {
            navigate('/app/dashboard');
        }
    }, [hasPermission, navigate]);

    if (!hasPermission()) {
        return null;
    }

    return children;
};

const RestaurantPanelRoutes = () => {
    const { getSingleActiveOutlet, hasPlanFeature } = useRestaurantData();
    const location = useLocation();
    // On the web app, these operational screens take over the full viewport
    // (no sidebar). On the native mobile app, they MUST keep RestaurantLayout
    // so the bottom navigation bar and mobile chrome remain available.
    const isFullScreenPage = !isNative && (location.pathname.startsWith('/app/panel/pos') || location.pathname.startsWith('/app/tables') || location.pathname.startsWith('/app/panel/kitchen-display') || location.pathname.startsWith('/app/panel/customer-display'));

    const singleActiveOutlet = getSingleActiveOutlet();
    const isAggregateView = !singleActiveOutlet;
    const isCloudKitchen = singleActiveOutlet?.outletType === 'CloudKitchen';

    const OperationalPage: React.FC<{ page: React.ReactElement, featureName: string, cloudKitchenDisabled?: boolean, requiredFeatureKey?: Parameters<typeof hasPlanFeature>[0] }> = ({ page, featureName, cloudKitchenDisabled = false, requiredFeatureKey }) => {
        if (isAggregateView) {
            return <FeatureDisabledPage type="selectOutlet" featureName={featureName} />;
        }
        if (cloudKitchenDisabled && isCloudKitchen) {
            return <FeatureDisabledPage type="feature" featureName={featureName} reason="This feature is not available for Cloud Kitchen outlets." />;
        }
        if (requiredFeatureKey && !hasPlanFeature(requiredFeatureKey)) {
            return <FeatureDisabledPage type="feature" featureName={featureName} reason="This feature is not included in your current plan." />;
        }
        return page;
    };


    const routes = (
        <Routes>
            <Route path="home" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="website-public" element={<LandingPage />} />
            <Route path="menu" element={<OperationalPage page={<MenuPage />} featureName="Food Menu" requiredFeatureKey="menu" />} />
            <Route path="item/list-food-menu-category" element={<OperationalPage page={<ListFoodMenuCategoryActualPage />} featureName="Food Categories" requiredFeatureKey="menu" />} />
            <Route path="item/list-pre-made-food" element={<OperationalPage page={<ListPreMadeFoodActualPage />} featureName="Pre-Made Food" requiredFeatureKey="menu" />} />
            <Route path="item/manage-addons" element={<OperationalPage page={<ManageAddonsPage />} featureName="Manage Add-ons" requiredFeatureKey="menu" />} />
            <Route path="settings/sound-settings" element={<SoundSettingsPage />} />
            <Route path="settings/app-settings" element={<AppSettingsPage />} />
            <Route path="settings/white-label" element={<WhiteLabelPage />} />
            <Route path="settings/list-printer" element={<ManagePrintersPage />} />
            <Route path="settings/list-counter" element={<ManageCountersPage />} />
            <Route path="settings/tax-setting" element={<TaxSettingPage />} />
            <Route path="settings/list-multiple-currency" element={<ManageCurrenciesPage />} />
            <Route path="settings/expense-categories" element={<ManageExpenseCategoriesPage />} />
            <Route path="settings/list-payment-method" element={<ListPaymentMethodPage />} />
            <Route path="settings/list-denomination" element={<ManageDenominationsPage />} />
            <Route path="settings/list-delivery-partner" element={<ListDeliveryPartnerPage />} />
            <Route path="settings/list-area-floor" element={<OperationalPage page={<ManageAreasFloorsPage />} featureName="Areas/Floors" cloudKitchenDisabled requiredFeatureKey="tables" />} />
            <Route path="settings/list-table" element={<OperationalPage page={<ManageTablesSettingsPage />} featureName="Table Settings" cloudKitchenDisabled requiredFeatureKey="tables" />} />
            <Route path="settings/floor-area-plan-design" element={<OperationalPage page={<FloorAreaPlanDesignPage />} featureName="Floor Plan Design" cloudKitchenDisabled requiredFeatureKey="tables" />} />
            <Route path="settings/kitchens" element={<ManageKitchensPage />} />
            <Route path="settings/waiters" element={<OperationalPage page={<ManageWaitersPage />} featureName="Waiter Management" cloudKitchenDisabled requiredFeatureKey="tables" />} />
            <Route path="tables" element={<OperationalPage page={<TablesPage />} featureName="Table Management" cloudKitchenDisabled requiredFeatureKey="tables" />} />
            <Route path="reservations" element={<OperationalPage page={<ReservationsPage />} featureName="Reservations" cloudKitchenDisabled requiredFeatureKey="reservations" />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="running-orders" element={<OperationalPage page={<RunningOrdersPage />} featureName="Running Orders" requiredFeatureKey="pos" />} />
            <Route path="panel/pos" element={<OperationalPage page={<PosPage />} featureName="Point of Sale" requiredFeatureKey="pos" />} />
            <Route path="panel/pos/:tableId" element={<OperationalPage page={<PosPage />} featureName="Point of Sale" requiredFeatureKey="pos" />} />
            <Route path="panel/kitchen-display" element={<OperationalPage page={<KitchenDisplayPage />} featureName="Kitchen Display" requiredFeatureKey="kds" />} />
            <Route path="panel/customer-display" element={<OperationalPage page={<CustomerDisplayPage />} featureName="Customer Display" requiredFeatureKey="customerDisplay" />} />
            <Route path="whatsapp/order-menu" element={<OperationalPage page={<WhatsappOrderMenuPage />} featureName="WhatsApp Order Menu" requiredFeatureKey="whatsapp" />} />
            <Route path="whatsapp/settings" element={<OperationalPage page={<WhatsappSettingsPage />} featureName="WhatsApp Settings" requiredFeatureKey="whatsapp" />} />
            <Route path="self-order/enable-disable" element={<OperationalPage page={<EnableDisableSelfOrderPage />} featureName="Self-Order" requiredFeatureKey="selfOrder" />} />
            <Route path="self-order/qr-generator" element={<OperationalPage page={<TableQrCodeGeneratorPage />} featureName="Table QR Generator" cloudKitchenDisabled requiredFeatureKey="selfOrder" />} />
            <Route path="self-order/receiving-user" element={<OperationalPage page={<OrderReceivingUserPage />} featureName="Self-Order" requiredFeatureKey="selfOrder" />} />
            <Route path="website-settings/order-enable-disable" element={<OperationalPage page={<OrderEnableDisablePage />} featureName="Website Ordering" requiredFeatureKey="website" />} />
            <Route path="website-settings/order-receiving-user" element={<OperationalPage page={<OrderReceivingUserPage />} featureName="Website Ordering" requiredFeatureKey="website" />} />
            <Route path="website-settings/website-white-label" element={<OperationalPage page={<WebsiteWhiteLabelPage />} featureName="Website White Label" requiredFeatureKey="website" />} />
            <Route path="website-settings/home/content" element={<OperationalPage page={<HomepageContentPage />} featureName="Homepage Content" requiredFeatureKey="website" />} />
            <Route path="website-settings/home/add-photo" element={<OperationalPage page={<AddPhotoPage />} featureName="Website Photos" requiredFeatureKey="website" />} />
            <Route path="website-settings/ai-website-builder" element={<OperationalPage page={<AiWebsiteBuilderPage />} featureName="AI Website Builder" requiredFeatureKey="website" />} />
            <Route path="website-settings/home/list-photo" element={<OperationalPage page={<ListPhotoPage />} featureName="Website Photos" requiredFeatureKey="website" />} />
            <Route path="website-settings/home/social-media" element={<OperationalPage page={<SocialMediaPage />} featureName="Social Media" requiredFeatureKey="website" />} />
            <Route path="website-settings/available-online-foods" element={<OperationalPage page={<AvailableOnlineFoodsPage />} featureName="Available Online Foods" requiredFeatureKey="website" />} />
            <Route path="website-settings/about-us-content" element={<OperationalPage page={<AboutUsContentPage />} featureName="About Us Content" requiredFeatureKey="website" />} />
            <Route path="website-settings/contact-us-content" element={<OperationalPage page={<ContactUsContentPage />} featureName="Contact Us Content" requiredFeatureKey="website" />} />
            <Route path="website-settings/contact-list" element={<OperationalPage page={<ContactListPage />} featureName="Contact List" requiredFeatureKey="website" />} />
            <Route path="website-settings/common-menu-page" element={<OperationalPage page={<CommonMenuPage />} featureName="Common Menu Page" requiredFeatureKey="website" />} />
            <Route path="website-settings/social-login-setting" element={<OperationalPage page={<SocialLoginSettingPage />} featureName="Social Login Setting" requiredFeatureKey="website" />} />
            <Route path="website-settings/email-setting" element={<OperationalPage page={<EmailSettingPage />} featureName="Email Setting" requiredFeatureKey="website" />} />
            <Route path="website-settings/payment-setting" element={<OperationalPage page={<PaymentSettingPage />} featureName="Payment Setting" requiredFeatureKey="website" />} />
            <Route path="website-settings/access-data" element={<AccessDataPage />} />
            <Route path="reservation-settings/enable-disable-reservation" element={<EnableDisableReservationPage />} />
            <Route path="reservation-settings/enable-disable" element={<EnableDisableReservationOrderPage />} />
            <Route path="reservation-settings/receiving-user" element={<ReservationOrderReceivingUserPage />} />
            <Route path="outlet-setting" element={<OutletSettingPage />} />
            <Route path="subscription" element={<OperationalPage page={<SubscriptionPage />} featureName="Subscription" requiredFeatureKey="subscription" />} />
            <Route path="stock/levels" element={<OperationalPage page={<ViewStockLevelsActualPage />} featureName="Stock Levels" requiredFeatureKey="inventory" />} />
            <Route path="stock/add-entry" element={<OperationalPage page={<AddStockEntryActualPage />} featureName="Add Stock Entry" requiredFeatureKey="inventory" />} />
            <Route path="stock/adjustments" element={<OperationalPage page={<StockAdjustmentsActualPage />} featureName="Stock Adjustments" requiredFeatureKey="inventory" />} />
            <Route path="stock/suppliers" element={<OperationalPage page={<ManageSuppliersActualPage />} featureName="Manage Suppliers" requiredFeatureKey="inventory" />} />
            <Route path="stock/low-stock-report" element={<OperationalPage page={<LowStockReportActualPage />} featureName="Low Stock Report" requiredFeatureKey="inventory" />} />
            <Route path="sale" element={<OperationalPage page={<SalesHistoryPage />} featureName="Sale History" requiredFeatureKey="customers" />} />
            <Route path="customer" element={<OperationalPage page={<CustomerPage />} featureName="Manage Customers" requiredFeatureKey="customers" />} />
            <Route path="customer/:customerId" element={<OperationalPage page={<CustomerDetailPage />} featureName="Customer Details" requiredFeatureKey="customers" />} />
            <Route path="customer-due-receive" element={<OperationalPage page={<CustomerDueReceivePageActual />} featureName="Customer Due Receive" requiredFeatureKey="customers" />} />
            <Route path="purchase" element={<OperationalPage page={<ActualPurchasePage />} featureName="Purchases" requiredFeatureKey="purchase" />} />
            <Route path="purchase/add" element={<OperationalPage page={<AddPurchaseActualPage />} featureName="Add Purchase" requiredFeatureKey="purchase" />} />
            <Route path="supplier-due-payment" element={<OperationalPage page={<ActualSupplierDuePaymentPage />} featureName="Supplier Due Payment" requiredFeatureKey="purchase" />} />
            <Route path="expense" element={<OperationalPage page={<FunctionalExpensePage />} featureName="Expense Management" requiredFeatureKey="purchase" />} />
            <Route path="waste" element={<FunctionalWastePage />} />
            <Route path="account-user" element={<AccountAndUserPage />} />
            <Route path="employees" element={<FunctionalEmployeesPage />} />
            <Route path="attendance" element={<FunctionalAttendancePage />} />
            <Route path="payroll" element={<FunctionalPayrollPage />} />
            <Route path="report" element={<ReportDashboardPage />} />
            <Route path="reports/register-report" element={<RegisterReportPage />} />
            <Route path="reports/z-report" element={<ZReportPage />} />
            <Route path="reports/kitchen-performance-report" element={<KitchenPerformanceReportPage />} />
            <Route path="reports/product-analysis-report" element={<ProductAnalysisReportPage />} />
            <Route path="reports/daily-summary-report" element={<DailySummaryReportActualPage />} />
            <Route path="reports/food-sale-report" element={<FoodSaleReportPage />} />
            <Route path="reports/daily-sale-report" element={<DailySaleReportPage />} />
            <Route path="reports/detailed-sale-report" element={<DetailedSaleReportPage />} />
            <Route path="reports/consumption-report" element={<ConsumptionReportPage />} />
            <Route path="reports/stock-report" element={<StockReportPage />} />
            <Route path="reports/profit-loss-report" element={<ProfitLossReportPage />} />
            <Route path="reports/supplier-ledger-report" element={<SupplierLedgerReportPage />} />
            <Route path="reports/customer-ledger-report" element={<CustomerLedgerReportPage />} />
            <Route path="reports/tax-report" element={<TaxReportPage />} />
            <Route path="reports/food-menu-sale-by-category" element={<FoodMenuSaleByCategoryPage />} />
            <Route path="reports/waiter-tips-report" element={<WaiterTipsReportPage />} />
            <Route path="reports/audit-log-report" element={<AuditLogReportPage />} />
            <Route path="reports/available-loyalty-point-report" element={<AvailableLoyaltyPointReportPage />} />
            <Route path="reports/usage-loyalty-point-report" element={<UsageLoyaltyPointReportPage />} />
            <Route path="reports/production-report" element={<ProductionReportPage />} />
            <Route path="reports/attendance-report" element={<AttendanceReportPage />} />
            <Route path="reports/supplier-due-report" element={<SupplierDueReportPage />} />
            <Route path="reports/customer-due-report" element={<CustomerDueReportPage />} />
            <Route path="reports/purchase-report" element={<PurchaseReportPage />} />
            <Route path="reports/expense-report" element={<ExpenseReportPage />} />
            <Route path="reports/waste-report" element={<WasteReportPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="send-sms" element={<SendSmsPage />} />
            <Route path="mobile-scanner" element={<MobileScanner />} />
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
    );

    return isFullScreenPage ? (
        <React.Suspense fallback={<Spinner />}>
            {routes}
        </React.Suspense>
    ) : (
        <RestaurantLayout>
            <React.Suspense fallback={<Spinner />}>
                {routes}
            </React.Suspense>
        </RestaurantLayout>
    );
}

const SaaSPanelRoutes = () => {
    const basePath = isSaaSDomain() ? '' : '/saas';
    return (
        <SaaSLayout>
            <Routes>
                <Route path="dashboard" element={<SaaSDashboardPage />} />
                <Route path="plans" element={<ManagePlansPage />} />
                <Route path="tenants" element={<ManageTenantsPage />} />
                <Route path="tenants/:tenantId" element={<TenantDetailsPage />} />
                <Route path="crm/leads" element={<CRMLeadsPage />} />
                
                <Route path="cms/*" element={<WebsiteCMSPage />} />
                
                <Route path="settings" element={<SaaSSettingsPage />} />
                <Route path="*" element={<Navigate to={`${basePath}/dashboard`} replace />} />
            </Routes>
        </SaaSLayout>
    )
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isSaaS = isSaaSDomain();
  
  if (isLoading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-gray-100"><Spinner size="lg" /></div>;
  }

  // If we are on the SaaS Domain (admin.xxx.com)
  if (isSaaS) {
      return (
        <React.Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-100"><Spinner size="lg" /></div>}>
          <Routes>
             <Route path="/" element={<Navigate to="/login" replace />} />
             <Route path="/login" element={
                 isAuthenticated && user?.isSuperAdmin 
                 ? <Navigate to="/dashboard" replace /> 
                 : <SaaSLoginPage />
             } />

             <Route 
               path="/*" 
               element={
                 isAuthenticated && user?.isSuperAdmin 
                 ? <SaaSPanelRoutes /> 
                 : <Navigate to="/login" replace />
               } 
             />
             <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
      );
  }

  // Default Restaurant App / Landing Page Routes
  return (
    <React.Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-100"><Spinner size="lg" /></div>}>
        <Routes>
            <Route path="/" element={<AuthAwareLanding />} />
            <Route path="/blogs" element={<SaaSBlogsPage />} />
            <Route path="/career" element={<DynamicSaaSPage />} />
            <Route path="/contact" element={<SaaSContactPage />} />
            <Route path="/features" element={<SaaSFeaturesPage />} />
            <Route path="/pricing" element={<SaaSPricingPage />} />
            <Route path="/products" element={<SaaSProductsShopPage />} />
            <Route path="/privacy-policy" element={<DynamicSaaSPage />} />
            <Route path="/terms-of-service" element={<DynamicSaaSPage />} />
            
            {/* Public Restaurant Website Routes */}
            <Route path="/public" element={<Outlet />}>
                <Route path="login" element={<PublicLoginPage />} />
                <Route path="register" element={<PublicRegisterPage />} />
            </Route>

            <Route path="/public/restaurant" element={<PublicLayout />}>
              <Route index element={<PublicHomePage />} />
              <Route path="menu" element={<PublicMenuPage />} />
              <Route path="about" element={<PublicAboutPage />} />
              <Route path="contact" element={<PublicContactPage />} />
            </Route>

            <Route path="/website/:slug" element={<PublicLayout />}>
              <Route index element={<PublicHomePage />} />
              <Route path="menu" element={<PublicMenuPage />} />
              <Route path="about" element={<PublicAboutPage />} />
              <Route path="contact" element={<PublicContactPage />} />
            </Route>
            
            {/* Public Invoice Route */}
            <Route path="/invoice/:id" element={<PublicInvoicePage />} />
            
            {/* Customer Panel Routes */}
            <Route path="/customer" element={isAuthenticated && user?.roleId === 'role-customer' ? <CustomerLayout /> : <Navigate to="/public/login" replace />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CustomerDashboardPage />} />
                <Route path="profile" element={<CustomerProfilePage />} />
                <Route path="orders" element={<CustomerOrdersPage />} />
                <Route path="reservations" element={<CustomerReservationsPage />} />
                <Route path="settings" element={<CustomerSettingsPage />} />
            </Route>
            
            {/* Auth Routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to={user?.isSuperAdmin ? "/saas/dashboard" : "/app/dashboard"} replace /> : <AuthSwitchWrapper mode="login" />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to={user?.isSuperAdmin ? "/saas/dashboard" : "/app/dashboard"} replace /> : <AuthSwitchWrapper mode="register" />} />

            <Route
                path="/saas/login"
                element={
                    isAuthenticated && user?.isSuperAdmin
                        ? <Navigate to="/saas/dashboard" replace />
                        : <SaaSLoginPage />
                }
            />

            {/* SaaS Admin Routes (Accessible on localhost if SuperAdmin) */}
            <Route 
                path="/saas/*" 
                element={
                    isAuthenticated && user?.isSuperAdmin 
                    ? <SaaSPanelRoutes /> 
                    : <Navigate to="/saas/login" replace />
                } 
            />

            {/* Restaurant App Routes */}
            <Route 
                path="/app/*" 
                element={
                    isAuthenticated 
                    ? <RestaurantPanelRoutes /> 
                    : <Navigate to="/login" replace />
                } 
            />
            
            {/* Dynamic Slug Page - last to catch all */}
            <Route path="/:slug" element={<DynamicSaaSPage />} />
        </Routes>
    </React.Suspense>
  );
}

const ScrollPositionManager: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const keyRef = React.useRef(location.key);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    keyRef.current = location.key;
  }, [location.key]);

  React.useEffect(() => {
    const save = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        try {
          sessionStorage.setItem(`rb_scroll:${keyRef.current}`, String(window.scrollY));
        } catch {
        }
      });
    };

    window.addEventListener('scroll', save, { passive: true });
    return () => {
      window.removeEventListener('scroll', save);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (navigationType === 'POP') {
      let y = 0;
      try {
        const raw = sessionStorage.getItem(`rb_scroll:${location.key}`);
        y = raw ? Number(raw) : 0;
      } catch {
        y = 0;
      }

      window.requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }));
      const t = window.setTimeout(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }), 60);
      return () => window.clearTimeout(t);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.key, navigationType]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollPositionManager />
      <AuthProvider>
        <RestaurantDataProvider>
          <MobileProvider>
            <AppContent />
          </MobileProvider>
        </RestaurantDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

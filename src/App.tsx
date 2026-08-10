



import React from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigationType, useNavigate } from 'react-router-dom';

import { RestaurantDataProvider, useRestaurantData } from './hooks/useRestaurantData';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';
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
const PublicQrMenuPage = React.lazy(() => import('./pages/public/PublicQrMenuPage'));
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
const SupplierProfilePage = React.lazy(() => import('./pages/stock/SupplierProfilePage'));
const ManageAreasFloorsPage = React.lazy(() => import('./pages/settings/ManageAreasFloorsPage'));
const ManageKitchensPage = React.lazy(() => import('./pages/settings/ManageKitchensPage'));
const ManagePrintersPage = React.lazy(() => import('./pages/settings/ManagePrintersPage'));
const ManageCountersPage = React.lazy(() => import('./pages/settings/ManageCountersPage'));
const ManageTablesSettingsPage = React.lazy(() => import('./pages/settings/ManageTablesSettingsPage'));
const ManageWaitersPage = React.lazy(() => import('./pages/settings/ManageWaitersPage'));
const ManageCurrenciesPage = React.lazy(() => import('./pages/settings/ManageCurrenciesPage'));
const LowStockReportActualPage = React.lazy(() => import('./pages/stock/LowStockReportPage'));
const RecipeManagementPage = React.lazy(() => import('./pages/stock/RecipeManagementPage'));
const SalesHistoryPage = React.lazy(() => import('./pages/SalesHistoryPage'));
const CustomerPage = React.lazy(() => import('./pages/CustomerPage'));
const CustomerDetailPage = React.lazy(() => import('./pages/CustomerDetailPage'));
const CustomerDueReceivePageActual = React.lazy(() => import('./pages/CustomerDueReceivePage'));
const ActualPurchasePage = React.lazy(() => import('./pages/PurchasePage'));
const AddPurchaseActualPage = React.lazy(() => import('./pages/purchase/AddPurchasePage'));
const EditPurchasePage = React.lazy(() => import('./pages/purchase/EditPurchasePage'));
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
const BackupDashboardPage = React.lazy(() => import('./pages/BackupDashboardPage'));
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
        return requiredPermissions.some(perm => {
            // Exact match
            if (userPermissions.includes(perm)) return true;
            // Resource-level shortcut (e.g., 'inventory' matches 'inventory.view')
            const resource = perm.split('.')[0];
            if (userPermissions.includes(resource)) return true;
            return false;
        });
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
        return <ErrorBoundary fallbackTitle={`Error in ${featureName}`}>{page}</ErrorBoundary>;
    };


    const routes = (
        <Routes>
            <Route path="home" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="website-public" element={<LandingPage />} />
            <Route path="menu" element={<ProtectedRoute requiredPermissions={['menu.view']}><OperationalPage page={<MenuPage />} featureName="Food Menu" requiredFeatureKey="menu" /></ProtectedRoute>} />
            <Route path="item/list-food-menu-category" element={<ProtectedRoute requiredPermissions={['menu.view']}><OperationalPage page={<ListFoodMenuCategoryActualPage />} featureName="Food Categories" requiredFeatureKey="menu" /></ProtectedRoute>} />
            <Route path="item/list-pre-made-food" element={<ProtectedRoute requiredPermissions={['menu.view']}><OperationalPage page={<ListPreMadeFoodActualPage />} featureName="Pre-Made Food" requiredFeatureKey="menu" /></ProtectedRoute>} />
            <Route path="item/manage-addons" element={<ProtectedRoute requiredPermissions={['menu.view']}><OperationalPage page={<ManageAddonsPage />} featureName="Manage Add-ons" requiredFeatureKey="menu" /></ProtectedRoute>} />
            <Route path="settings/sound-settings" element={<ProtectedRoute requiredPermissions={['settings.view']}><SoundSettingsPage /></ProtectedRoute>} />
            <Route path="settings/app-settings" element={<ProtectedRoute requiredPermissions={['settings.view']}><AppSettingsPage /></ProtectedRoute>} />
            <Route path="settings/white-label" element={<ProtectedRoute requiredPermissions={['settings.view']}><WhiteLabelPage /></ProtectedRoute>} />
            <Route path="settings/list-printer" element={<ProtectedRoute requiredPermissions={['settings.view']}><ManagePrintersPage /></ProtectedRoute>} />
            <Route path="settings/list-counter" element={<ProtectedRoute requiredPermissions={['settings.view']}><ManageCountersPage /></ProtectedRoute>} />
            <Route path="settings/tax-setting" element={<ProtectedRoute requiredPermissions={['settings.view']}><TaxSettingPage /></ProtectedRoute>} />
            <Route path="settings/list-multiple-currency" element={<ProtectedRoute requiredPermissions={['settings.view']}><ManageCurrenciesPage /></ProtectedRoute>} />
            <Route path="settings/expense-categories" element={<ProtectedRoute requiredPermissions={['settings.view']}><ManageExpenseCategoriesPage /></ProtectedRoute>} />
            <Route path="settings/list-payment-method" element={<ProtectedRoute requiredPermissions={['settings.view']}><ListPaymentMethodPage /></ProtectedRoute>} />
            <Route path="settings/list-denomination" element={<ProtectedRoute requiredPermissions={['settings.view']}><ManageDenominationsPage /></ProtectedRoute>} />
            <Route path="settings/list-delivery-partner" element={<ProtectedRoute requiredPermissions={['settings.view']}><ListDeliveryPartnerPage /></ProtectedRoute>} />
            <Route path="settings/list-area-floor" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<ManageAreasFloorsPage />} featureName="Areas/Floors" cloudKitchenDisabled requiredFeatureKey="tables" /></ProtectedRoute>} />
            <Route path="settings/list-table" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<ManageTablesSettingsPage />} featureName="Table Settings" cloudKitchenDisabled requiredFeatureKey="tables" /></ProtectedRoute>} />
            <Route path="settings/floor-area-plan-design" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<FloorAreaPlanDesignPage />} featureName="Floor Plan Design" cloudKitchenDisabled requiredFeatureKey="tables" /></ProtectedRoute>} />
            <Route path="settings/kitchens" element={<ProtectedRoute requiredPermissions={['settings.view']}><ManageKitchensPage /></ProtectedRoute>} />
            <Route path="settings/waiters" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<ManageWaitersPage />} featureName="Waiter Management" cloudKitchenDisabled requiredFeatureKey="tables" /></ProtectedRoute>} />
            <Route path="tables" element={<ProtectedRoute requiredPermissions={['tables.view']}><OperationalPage page={<TablesPage />} featureName="Table Management" cloudKitchenDisabled requiredFeatureKey="tables" /></ProtectedRoute>} />
            <Route path="reservations" element={<ProtectedRoute requiredPermissions={['reservations.view']}><OperationalPage page={<ReservationsPage />} featureName="Reservations" cloudKitchenDisabled requiredFeatureKey="reservations" /></ProtectedRoute>} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="running-orders" element={<ProtectedRoute requiredPermissions={['orders.view']}><OperationalPage page={<RunningOrdersPage />} featureName="Running Orders" requiredFeatureKey="pos" /></ProtectedRoute>} />
            <Route path="panel/pos" element={<ProtectedRoute requiredPermissions={['pos.view']}><OperationalPage page={<PosPage />} featureName="Point of Sale" requiredFeatureKey="pos" /></ProtectedRoute>} />
            <Route path="panel/pos/:tableId" element={<ProtectedRoute requiredPermissions={['pos.view']}><OperationalPage page={<PosPage />} featureName="Point of Sale" requiredFeatureKey="pos" /></ProtectedRoute>} />
            <Route path="panel/kitchen-display" element={<ProtectedRoute requiredPermissions={['kitchen.view']}><OperationalPage page={<KitchenDisplayPage />} featureName="Kitchen Display" requiredFeatureKey="kds" /></ProtectedRoute>} />
            <Route path="panel/customer-display" element={<OperationalPage page={<CustomerDisplayPage />} featureName="Customer Display" requiredFeatureKey="customerDisplay" />} />
            <Route path="whatsapp/order-menu" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<WhatsappOrderMenuPage />} featureName="WhatsApp Order Menu" requiredFeatureKey="whatsapp" /></ProtectedRoute>} />
            <Route path="whatsapp/settings" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<WhatsappSettingsPage />} featureName="WhatsApp Settings" requiredFeatureKey="whatsapp" /></ProtectedRoute>} />
            <Route path="self-order/enable-disable" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<EnableDisableSelfOrderPage />} featureName="Self-Order" requiredFeatureKey="selfOrder" /></ProtectedRoute>} />
            <Route path="self-order/qr-generator" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<TableQrCodeGeneratorPage />} featureName="Table QR Generator" cloudKitchenDisabled requiredFeatureKey="selfOrder" /></ProtectedRoute>} />
            <Route path="self-order/receiving-user" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<OrderReceivingUserPage />} featureName="Self-Order" requiredFeatureKey="selfOrder" /></ProtectedRoute>} />
            <Route path="website-settings/order-enable-disable" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<OrderEnableDisablePage />} featureName="Website Ordering" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/order-receiving-user" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<OrderReceivingUserPage />} featureName="Website Ordering" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/website-white-label" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<WebsiteWhiteLabelPage />} featureName="Website White Label" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/home/content" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<HomepageContentPage />} featureName="Homepage Content" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/home/add-photo" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<AddPhotoPage />} featureName="Website Photos" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/ai-website-builder" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<AiWebsiteBuilderPage />} featureName="AI Website Builder" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/home/list-photo" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<ListPhotoPage />} featureName="Website Photos" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/home/social-media" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<SocialMediaPage />} featureName="Social Media" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/available-online-foods" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<AvailableOnlineFoodsPage />} featureName="Available Online Foods" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/about-us-content" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<AboutUsContentPage />} featureName="About Us Content" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/contact-us-content" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<ContactUsContentPage />} featureName="Contact Us Content" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/contact-list" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<ContactListPage />} featureName="Contact List" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/common-menu-page" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<CommonMenuPage />} featureName="Common Menu Page" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/social-login-setting" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<SocialLoginSettingPage />} featureName="Social Login Setting" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/email-setting" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<EmailSettingPage />} featureName="Email Setting" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/payment-setting" element={<ProtectedRoute requiredPermissions={['settings.view']}><OperationalPage page={<PaymentSettingPage />} featureName="Payment Setting" requiredFeatureKey="website" /></ProtectedRoute>} />
            <Route path="website-settings/access-data" element={<ProtectedRoute requiredPermissions={['settings.view']}><AccessDataPage /></ProtectedRoute>} />
            <Route path="reservation-settings/enable-disable-reservation" element={<ProtectedRoute requiredPermissions={['settings.view']}><EnableDisableReservationPage /></ProtectedRoute>} />
            <Route path="reservation-settings/enable-disable" element={<ProtectedRoute requiredPermissions={['settings.view']}><EnableDisableReservationOrderPage /></ProtectedRoute>} />
            <Route path="reservation-settings/receiving-user" element={<ProtectedRoute requiredPermissions={['settings.view']}><ReservationOrderReceivingUserPage /></ProtectedRoute>} />
            <Route path="outlet-setting" element={<ProtectedRoute requiredPermissions={['settings.view']}><OutletSettingPage /></ProtectedRoute>} />
            <Route path="subscription" element={<OperationalPage page={<SubscriptionPage />} featureName="Subscription" requiredFeatureKey="subscription" />} />
            <Route path="stock/levels" element={<ProtectedRoute requiredPermissions={['inventory.view']}><OperationalPage page={<ViewStockLevelsActualPage />} featureName="Stock Levels" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="stock/add-entry" element={<ProtectedRoute requiredPermissions={['inventory.create']}><OperationalPage page={<AddStockEntryActualPage />} featureName="Add Stock Entry" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="stock/adjustments" element={<ProtectedRoute requiredPermissions={['inventory.edit']}><OperationalPage page={<StockAdjustmentsActualPage />} featureName="Stock Adjustments" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="stock/suppliers" element={<ProtectedRoute requiredPermissions={['inventory.view']}><OperationalPage page={<ManageSuppliersActualPage />} featureName="Manage Suppliers" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="stock/suppliers/:supplierId" element={<ProtectedRoute requiredPermissions={['inventory.view']}><OperationalPage page={<SupplierProfilePage />} featureName="Supplier Profile" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="stock/low-stock-report" element={<ProtectedRoute requiredPermissions={['inventory.view']}><OperationalPage page={<LowStockReportActualPage />} featureName="Low Stock Report" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="stock/recipes" element={<ProtectedRoute requiredPermissions={['inventory.view']}><OperationalPage page={<RecipeManagementPage />} featureName="Recipe Management" requiredFeatureKey="inventory" /></ProtectedRoute>} />
            <Route path="sale" element={<ProtectedRoute requiredPermissions={['sales.view']}><OperationalPage page={<SalesHistoryPage />} featureName="Sale History" requiredFeatureKey="customers" /></ProtectedRoute>} />
            <Route path="customer" element={<ProtectedRoute requiredPermissions={['customers.view']}><OperationalPage page={<CustomerPage />} featureName="Manage Customers" requiredFeatureKey="customers" /></ProtectedRoute>} />
            <Route path="customer/:customerId" element={<ProtectedRoute requiredPermissions={['customers.view']}><OperationalPage page={<CustomerDetailPage />} featureName="Customer Details" requiredFeatureKey="customers" /></ProtectedRoute>} />
            <Route path="customer-due-receive" element={<ProtectedRoute requiredPermissions={['customers.view']}><OperationalPage page={<CustomerDueReceivePageActual />} featureName="Customer Due Receive" requiredFeatureKey="customers" /></ProtectedRoute>} />
            <Route path="purchase" element={<ProtectedRoute requiredPermissions={['purchase.view']}><OperationalPage page={<ActualPurchasePage />} featureName="Purchases" requiredFeatureKey="purchase" /></ProtectedRoute>} />
            <Route path="purchase/add" element={<ProtectedRoute requiredPermissions={['purchase.create']}><OperationalPage page={<AddPurchaseActualPage />} featureName="Add Purchase" requiredFeatureKey="purchase" /></ProtectedRoute>} />
            <Route path="purchase/edit/:id" element={<ProtectedRoute requiredPermissions={['purchase.edit']}><OperationalPage page={<EditPurchasePage />} featureName="Edit Purchase" requiredFeatureKey="purchase" /></ProtectedRoute>} />
            <Route path="supplier-due-payment" element={<ProtectedRoute requiredPermissions={['purchase.view']}><OperationalPage page={<ActualSupplierDuePaymentPage />} featureName="Supplier Due Payment" requiredFeatureKey="purchase" /></ProtectedRoute>} />
            <Route path="expense" element={<ProtectedRoute requiredPermissions={['purchase.view']}><OperationalPage page={<FunctionalExpensePage />} featureName="Expense Management" requiredFeatureKey="purchase" /></ProtectedRoute>} />
            <Route path="waste" element={<ProtectedRoute requiredPermissions={['inventory.view']}><FunctionalWastePage /></ProtectedRoute>} />
            <Route path="backup" element={<ProtectedRoute requiredPermissions={['users.view']}><BackupDashboardPage /></ProtectedRoute>} />
            <Route path="account-user" element={<ProtectedRoute requiredPermissions={['users.view']}><AccountAndUserPage /></ProtectedRoute>} />
            <Route path="employees" element={<ProtectedRoute requiredPermissions={['users.view']}><FunctionalEmployeesPage /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute requiredPermissions={['users.view']}><FunctionalAttendancePage /></ProtectedRoute>} />
            <Route path="payroll" element={<ProtectedRoute requiredPermissions={['accounting.view']}><FunctionalPayrollPage /></ProtectedRoute>} />
            <Route path="report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ReportDashboardPage /></ProtectedRoute>} />
            <Route path="reports/register-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><RegisterReportPage /></ProtectedRoute>} />
            <Route path="reports/z-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ZReportPage /></ProtectedRoute>} />
            <Route path="reports/kitchen-performance-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><KitchenPerformanceReportPage /></ProtectedRoute>} />
            <Route path="reports/product-analysis-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ProductAnalysisReportPage /></ProtectedRoute>} />
            <Route path="reports/daily-summary-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><DailySummaryReportActualPage /></ProtectedRoute>} />
            <Route path="reports/food-sale-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><FoodSaleReportPage /></ProtectedRoute>} />
            <Route path="reports/daily-sale-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><DailySaleReportPage /></ProtectedRoute>} />
            <Route path="reports/detailed-sale-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><DetailedSaleReportPage /></ProtectedRoute>} />
            <Route path="reports/consumption-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ConsumptionReportPage /></ProtectedRoute>} />
            <Route path="reports/stock-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><StockReportPage /></ProtectedRoute>} />
            <Route path="reports/profit-loss-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ProfitLossReportPage /></ProtectedRoute>} />
            <Route path="reports/supplier-ledger-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><SupplierLedgerReportPage /></ProtectedRoute>} />
            <Route path="reports/customer-ledger-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><CustomerLedgerReportPage /></ProtectedRoute>} />
            <Route path="reports/tax-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><TaxReportPage /></ProtectedRoute>} />
            <Route path="reports/food-menu-sale-by-category" element={<ProtectedRoute requiredPermissions={['reports.view']}><FoodMenuSaleByCategoryPage /></ProtectedRoute>} />
            <Route path="reports/waiter-tips-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><WaiterTipsReportPage /></ProtectedRoute>} />
            <Route path="reports/audit-log-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><AuditLogReportPage /></ProtectedRoute>} />
            <Route path="reports/available-loyalty-point-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><AvailableLoyaltyPointReportPage /></ProtectedRoute>} />
            <Route path="reports/usage-loyalty-point-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><UsageLoyaltyPointReportPage /></ProtectedRoute>} />
            <Route path="reports/production-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ProductionReportPage /></ProtectedRoute>} />
            <Route path="reports/attendance-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><AttendanceReportPage /></ProtectedRoute>} />
            <Route path="reports/supplier-due-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><SupplierDueReportPage /></ProtectedRoute>} />
            <Route path="reports/customer-due-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><CustomerDueReportPage /></ProtectedRoute>} />
            <Route path="reports/purchase-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><PurchaseReportPage /></ProtectedRoute>} />
            <Route path="reports/expense-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><ExpenseReportPage /></ProtectedRoute>} />
            <Route path="reports/waste-report" element={<ProtectedRoute requiredPermissions={['reports.view']}><WasteReportPage /></ProtectedRoute>} />
            <Route path="production" element={<ProtectedRoute requiredPermissions={['inventory.view']}><ProductionPage /></ProtectedRoute>} />
            <Route path="send-sms" element={<ProtectedRoute requiredPermissions={['settings.view']}><SendSmsPage /></ProtectedRoute>} />
            <Route path="mobile-scanner" element={<ProtectedRoute requiredPermissions={['pos.view']}><MobileScanner /></ProtectedRoute>} />
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

            {/* Public QR Menu — no login required */}
            <Route path="/qr-menu/:tableId" element={<React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}><PublicQrMenuPage /></React.Suspense>} />

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

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../store/authStore.js';
import { AnnouncementBar } from '../components/storefront/AnnouncementBar.js';
import { Header } from '../components/storefront/Header.js';
import { Footer } from '../components/storefront/Footer.js';
import { MobileAppInstallPrompt } from '../components/storefront/MobileAppInstallPrompt.js';
import { AdminLayout } from '../components/admin/AdminLayout.js';
import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { useAnalyticsTracker } from '../hooks/useAnalyticsTracker.js';

// 1. Critical above-the-fold page loaded synchronously
import { HomePage } from '../pages/storefront/HomePage.js';

// 2. Secondary Storefront Pages — Lazy Loaded with route-level code splitting
const ShopPage = lazy(() => import('../pages/storefront/ShopPage.js').then((m) => ({ default: m.ShopPage })));
const NewArrivalsPage = lazy(() => import('../pages/storefront/NewArrivalsPage.js').then((m) => ({ default: m.NewArrivalsPage })));
const CategoryPage = lazy(() => import('../pages/storefront/CategoryPage.js').then((m) => ({ default: m.CategoryPage })));
const ProductDetailsPage = lazy(() => import('../pages/storefront/ProductDetailsPage.js').then((m) => ({ default: m.ProductDetailsPage })));
const CartPage = lazy(() => import('../pages/storefront/CartPage.js').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/storefront/CheckoutPage.js').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('../pages/storefront/OrderSuccessPage.js').then((m) => ({ default: m.OrderSuccessPage })));
const SearchPage = lazy(() => import('../pages/storefront/SearchPage.js').then((m) => ({ default: m.SearchPage })));
const AboutPage = lazy(() => import('../pages/storefront/AboutPage.js').then((m) => ({ default: m.AboutPage })));
const ShippingPolicyPage = lazy(() => import('../pages/storefront/ShippingPolicyPage.js').then((m) => ({ default: m.ShippingPolicyPage })));
const ReturnsPolicyPage = lazy(() => import('../pages/storefront/ReturnsPolicyPage.js').then((m) => ({ default: m.ReturnsPolicyPage })));
const FaqPage = lazy(() => import('../pages/storefront/FaqPage.js').then((m) => ({ default: m.FaqPage })));
const SheinOrderPage = lazy(() => import('../pages/storefront/SheinOrderPage.js').then((m) => ({ default: m.SheinOrderPage })));
const NotFoundPage = lazy(() => import('../pages/storefront/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage })));

// 3. Admin Pages — Strictly Lazy Loaded (Never bundled into storefront initial JS)
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage.js').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage.js').then((m) => ({ default: m.AdminProductsPage })));
const AdminProductFormPage = lazy(() => import('../pages/admin/AdminProductFormPage.js').then((m) => ({ default: m.AdminProductFormPage })));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage.js').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminAttributesPage = lazy(() => import('../pages/admin/AdminAttributesPage.js').then((m) => ({ default: m.AdminAttributesPage })));
const AdminDiscountsPage = lazy(() => import('../pages/admin/AdminDiscountsPage.js').then((m) => ({ default: m.AdminDiscountsPage })));
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage.js').then((m) => ({ default: m.AdminOrdersPage })));
const AdminSheinOrdersPage = lazy(() => import('../pages/admin/AdminSheinOrdersPage.js').then((m) => ({ default: m.AdminSheinOrdersPage })));
const AdminOrderDetailsPage = lazy(() => import('../pages/admin/AdminOrderDetailsPage.js').then((m) => ({ default: m.AdminOrderDetailsPage })));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage.js').then((m) => ({ default: m.AdminUsersPage })));
const AdminCmsPage = lazy(() => import('../pages/admin/AdminCmsPage.js').then((m) => ({ default: m.AdminCmsPage })));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage.js').then((m) => ({ default: m.AdminSettingsPage })));
const AdminMediaPage = lazy(() => import('../pages/admin/AdminMediaPage.js').then((m) => ({ default: m.AdminMediaPage })));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AdminAuditLogsPage.js').then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage.js').then((m) => ({ default: m.AdminAnalyticsPage })));

// Scroll to top helper
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Lightweight route transition loader
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Storefront Root Layout
function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileAppInstallPrompt />
    </div>
  );
}

// Protected Admin Route Guard
function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium font-sans">
            جاري التحقق من الجلسة والصلاحيات...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/darsh50/login" state={{ from: location }} replace />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AdminLayout />
      </Suspense>
    </ErrorBoundary>
  );
}

export const AppRoutes: React.FC = () => {
  // Global automatic visitor and behavioral analytics tracker (fire-and-forget)
  useAnalyticsTracker();

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Storefront Layout */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/success" element={<OrderSuccessPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/shipping" element={<ShippingPolicyPage />} />
          <Route path="/returns" element={<ReturnsPolicyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/shein-order" element={<SheinOrderPage />} />
        </Route>

        {/* Admin Login */}
        <Route
          path="/darsh50/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminLoginPage />
            </Suspense>
          }
        />

        {/* Protected Admin Routes */}
        <Route path="/darsh50" element={<ProtectedAdminRoute />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="attributes" element={<AdminAttributesPage />} />
          <Route path="discounts" element={<AdminDiscountsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="shein-orders" element={<AdminSheinOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="cms" element={<AdminCmsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
};

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../store/authStore.js';
import { AnnouncementBar } from '../components/storefront/AnnouncementBar.js';
import { Header } from '../components/storefront/Header.js';
import { Footer } from '../components/storefront/Footer.js';
import { MobileAppInstallPrompt } from '../components/storefront/MobileAppInstallPrompt.js';
import { AdminLayout } from '../components/admin/AdminLayout.js';

// Storefront Pages
import { HomePage } from '../pages/storefront/HomePage.js';
import { ShopPage } from '../pages/storefront/ShopPage.js';
import { NewArrivalsPage } from '../pages/storefront/NewArrivalsPage.js';
import { CategoryPage } from '../pages/storefront/CategoryPage.js';
import { ProductDetailsPage } from '../pages/storefront/ProductDetailsPage.js';
import { CartPage } from '../pages/storefront/CartPage.js';
import { CheckoutPage } from '../pages/storefront/CheckoutPage.js';
import { OrderSuccessPage } from '../pages/storefront/OrderSuccessPage.js';
import { SearchPage } from '../pages/storefront/SearchPage.js';
import { AboutPage } from '../pages/storefront/AboutPage.js';
import { ShippingPolicyPage } from '../pages/storefront/ShippingPolicyPage.js';
import { ReturnsPolicyPage } from '../pages/storefront/ReturnsPolicyPage.js';
import { FaqPage } from '../pages/storefront/FaqPage.js';
import { NotFoundPage } from '../pages/storefront/NotFoundPage.js';

// Admin Pages
import { AdminLoginPage } from '../pages/admin/AdminLoginPage.js';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.js';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage.js';
import { AdminProductFormPage } from '../pages/admin/AdminProductFormPage.js';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage.js';
import { AdminAttributesPage } from '../pages/admin/AdminAttributesPage.js';
import { AdminDiscountsPage } from '../pages/admin/AdminDiscountsPage.js';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage.js';
import { AdminOrderDetailsPage } from '../pages/admin/AdminOrderDetailsPage.js';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage.js';
import { AdminCmsPage } from '../pages/admin/AdminCmsPage.js';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage.js';
import { AdminMediaPage } from '../pages/admin/AdminMediaPage.js';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage.js';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage.js';
import { useAnalyticsTracker } from '../hooks/useAnalyticsTracker.js';

// Scroll to top helper
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Storefront Root Layout
function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Outlet />
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

  return <AdminLayout />;
}

export const AppRoutes: React.FC = () => {
  // Global automatic visitor and behavioral analytics tracker
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
        </Route>

        {/* Admin Login */}
        <Route path="/darsh50/login" element={<AdminLoginPage />} />

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
          <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="cms" element={<AdminCmsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

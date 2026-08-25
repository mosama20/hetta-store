import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '../../store/settingsStore.js';
import { useTheme } from '../../store/themeStore.js';

export const HeadManager: React.FC = () => {
  const { settings } = useStoreSettings();
  const { isArabic } = useTheme();
  const location = useLocation();

  useEffect(() => {
    // 1. Update Favicon dynamically
    const faviconHref = settings.favicon_url?.trim() || '/favicon.svg';
    let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = faviconHref;

    let appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = faviconHref;

    // 2. Determine base brand title
    const brandTitle = isArabic
      ? settings.store_title_ar || settings.store_name_ar || 'CRAFT'
      : settings.store_title_en || settings.store_name_en || 'CRAFT';

    const brandName = isArabic
      ? settings.store_name_ar || 'CRAFT'
      : settings.store_name_en || 'CRAFT';

    // 3. Page specific suffixes/titles
    const path = location.pathname;
    let pageSuffix = '';

    if (path === '/') {
      pageSuffix = '';
    } else if (path === '/shop') {
      pageSuffix = isArabic ? 'المنتجات والتشكيلات' : 'All Products';
    } else if (path === '/cart') {
      pageSuffix = isArabic ? 'سلة المشتريات' : 'Shopping Cart';
    } else if (path === '/checkout') {
      pageSuffix = isArabic ? 'إتمام الطلب' : 'Checkout';
    } else if (path === '/about') {
      pageSuffix = isArabic ? `عن ${brandName}` : `About ${brandName}`;
    } else if (path === '/shipping') {
      pageSuffix = isArabic ? 'سياسة الشحن' : 'Shipping Policy';
    } else if (path === '/returns') {
      pageSuffix = isArabic ? 'سياسة الاستبدال والاسترجاع' : 'Returns & Exchange';
    } else if (path === '/faq') {
      pageSuffix = isArabic ? 'الأسئلة الشائعة' : 'FAQ';
    } else if (path.startsWith('/admin')) {
      pageSuffix = isArabic ? 'لوحة الإدارة' : 'Admin Portal';
    }

    if (pageSuffix) {
      document.title = `${pageSuffix} | ${brandTitle}`;
    } else {
      document.title = brandTitle;
    }
  }, [settings, isArabic, location.pathname]);

  return null;
};

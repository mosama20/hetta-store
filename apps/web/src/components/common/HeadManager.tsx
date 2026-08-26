import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '../../store/settingsStore.js';
import { useTheme } from '../../store/themeStore.js';

export const HeadManager: React.FC = () => {
  const { settings } = useStoreSettings();
  const { isArabic } = useTheme();
  const location = useLocation();

  useEffect(() => {
    // 1. Determine actual store branding & names
    const brandName = isArabic
      ? settings.store_name_ar || 'HETTA'
      : settings.store_name_en || 'HETTA';

    const brandTitle = isArabic
      ? settings.store_title_ar || settings.store_name_ar || 'HETTA | متجر الأزياء العصرية'
      : settings.store_title_en || settings.store_name_en || 'HETTA | Modern Fashion Store';

    // Real store logo image & favicon
    const actualLogoUrl = settings.store_logo?.trim() || settings.favicon_url?.trim() || '/favicon.svg';
    const faviconHref = settings.favicon_url?.trim() || settings.store_logo?.trim() || '/favicon.svg';

    // 2. Update Favicon & Shortcut Icon dynamically
    let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = faviconHref;

    // 3. Update Apple Touch Icon with the REAL store logo
    let appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = actualLogoUrl;

    // 4. Update Mobile & Apple Web App Title
    let appleTitleMeta = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.content = brandName;

    let appNameMeta = document.querySelector<HTMLMetaElement>("meta[name='application-name']");
    if (!appNameMeta) {
      appNameMeta = document.createElement('meta');
      appNameMeta.name = 'application-name';
      document.head.appendChild(appNameMeta);
    }
    appNameMeta.content = brandName;

    // 5. Update OpenGraph & Twitter Social / Sharing Meta Tags
    const setMetaTag = (attr: 'name' | 'property', attrValue: string, content: string) => {
      let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}='${attrValue}']`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, attrValue);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag('property', 'og:site_name', brandName);
    setMetaTag('property', 'og:title', brandTitle);
    setMetaTag('property', 'og:image', actualLogoUrl);
    setMetaTag('name', 'twitter:title', brandTitle);
    setMetaTag('name', 'twitter:image', actualLogoUrl);

    // 6. Dynamically Generate and Bind Real PWA Web App Manifest (for Add to Home Screen / Mobile Shortcuts)
    try {
      const dynamicManifest = {
        name: brandTitle,
        short_name: brandName,
        description: isArabic
          ? `تسوق أحدث صيحات الموضة والأزياء العصرية مع ${brandName}`
          : `Shop the latest modern fashion drops with ${brandName}`,
        start_url: '/',
        id: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
          {
            src: actualLogoUrl,
            sizes: '192x192 512x512',
            type: actualLogoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'any',
          },
          {
            src: actualLogoUrl,
            sizes: '192x192 512x512',
            type: actualLogoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['shopping', 'lifestyle', 'fashion'],
      };

      const manifestBlob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;
    } catch {
      // Ignore if blob URL creation is not supported
    }

    // 7. Page specific document titles
    const path = location.pathname;
    let pageSuffix = '';

    if (path === '/') {
      pageSuffix = '';
    } else if (path === '/shop') {
      pageSuffix = isArabic ? 'المنتجات والتشكيلات' : 'All Products';
    } else if (path === '/new-arrivals') {
      pageSuffix = isArabic ? 'أحدث التشكيلات' : 'New Arrivals';
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

import { CartItem, Product, Order } from '../types/index.js';
import { getApiBaseUrl } from '../api/client.js';

const VISITOR_ID_KEY = 'fs_visitor_id';
const SESSION_ID_KEY = 'fs_session_id';
const IP_CACHE_KEY = 'fs_visitor_ip';
const SESSION_START_KEY = 'fs_session_start';

function getOrGenerateId(key: string, storage: Storage): string {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = 'v-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return 'v-' + Math.random().toString(36).substring(2, 9);
  }
}

// Device detection helper
export function getDeviceInfo(): {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
      screenResolution: '1920x1080',
    };
  }

  const ua = navigator.userAgent;
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    ) ||
    window.innerWidth <= 768
  ) {
    deviceType = 'mobile';
  }

  // OS detection
  let os = 'Unknown';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser detection
  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/FBAN|FBAV/i.test(ua)) browser = 'Facebook App';
  else if (/Instagram/i.test(ua)) browser = 'Instagram App';
  else if (/TikTok/i.test(ua)) browser = 'TikTok App';

  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  return { deviceType, browser, os, screenResolution };
}

// Marketing & Referrer detection
export function getTrafficSource(): {
  referrer: string;
  sourceCategory: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
} {
  if (typeof window === 'undefined') {
    return { referrer: 'Direct', sourceCategory: 'Direct' };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || undefined;
  const utmMedium = params.get('utm_medium') || undefined;
  const utmCampaign = params.get('utm_campaign') || undefined;
  const utmContent = params.get('utm_content') || undefined;
  const utmTerm = params.get('utm_term') || undefined;

  const rawReferrer = document.referrer;
  let sourceCategory = 'Direct / مباشر';

  if (utmSource) {
    sourceCategory = utmSource.toUpperCase();
  } else if (rawReferrer) {
    const refLower = rawReferrer.toLowerCase();
    if (refLower.includes('facebook') || refLower.includes('fb.com')) {
      sourceCategory = 'Facebook';
    } else if (refLower.includes('instagram')) {
      sourceCategory = 'Instagram';
    } else if (refLower.includes('tiktok')) {
      sourceCategory = 'TikTok';
    } else if (refLower.includes('google')) {
      sourceCategory = 'Google Search / Ads';
    } else if (refLower.includes('snapchat')) {
      sourceCategory = 'Snapchat';
    } else if (refLower.includes('twitter') || refLower.includes('t.co') || refLower.includes('x.com')) {
      sourceCategory = 'Twitter / X';
    } else if (refLower.includes('youtube')) {
      sourceCategory = 'YouTube';
    } else {
      sourceCategory = 'Referral';
    }
  }

  return {
    referrer: rawReferrer || 'Direct / مباشر',
    sourceCategory,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  };
}

let cachedIp: string | null = null;

export function getVisitorIp(): string {
  if (cachedIp) return cachedIp;
  try {
    const stored = sessionStorage.getItem(IP_CACHE_KEY);
    if (stored) {
      cachedIp = stored;
      return stored;
    }
  } catch {}

  cachedIp = '127.0.0.1';
  return cachedIp;
}

/**
 * Non-blocking fire-and-forget analytics dispatcher.
 * Uses navigator.sendBeacon with fetch(..., { keepalive: true }) fallback.
 * Never awaits or blocks the application render pipeline.
 */
function sendAnalytics(endpoint: string, payload: unknown): void {
  if (typeof window === 'undefined') return;

  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const bodyStr = JSON.stringify(payload);

    // 1. Try navigator.sendBeacon
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      const queued = navigator.sendBeacon(url, blob);
      if (queued) return;
    }

    // 2. Fallback to fetch with keepalive: true
    if (typeof fetch === 'function') {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently — analytics must never affect application execution
  }
}

class AnalyticsTracker {
  private visitorId: string = '';
  private sessionId: string = '';
  private lastPath: string = '';
  private initialized = false;

  private ensureInit(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.visitorId = getOrGenerateId(VISITOR_ID_KEY, localStorage);
    this.sessionId = getOrGenerateId(SESSION_ID_KEY, sessionStorage);

    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }

    const ip = getVisitorIp();
    const device = getDeviceInfo();
    const traffic = getTrafficSource();

    sendAnalytics('/analytics/hit', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      screenResolution: device.screenResolution,
      referrer: traffic.sourceCategory,
      utmSource: traffic.utmSource,
      utmMedium: traffic.utmMedium,
      utmCampaign: traffic.utmCampaign,
      utmContent: traffic.utmContent,
      utmTerm: traffic.utmTerm,
      currentPath: window.location.pathname,
    });
  }

  public init(): void {
    this.ensureInit();
  }

  public trackPageView(path: string, title?: string): void {
    if (path === this.lastPath) return;
    this.lastPath = path;

    this.ensureInit();
    const ip = getVisitorIp();
    const device = getDeviceInfo();
    const traffic = getTrafficSource();

    // Session update hit
    sendAnalytics('/analytics/hit', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      screenResolution: device.screenResolution,
      referrer: traffic.sourceCategory,
      utmSource: traffic.utmSource,
      utmMedium: traffic.utmMedium,
      utmCampaign: traffic.utmCampaign,
      utmContent: traffic.utmContent,
      utmTerm: traffic.utmTerm,
      currentPath: path,
    });

    // Page view event
    sendAnalytics('/analytics/event', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      eventType: 'page_view',
      path,
      payload: {
        title: title || (typeof document !== 'undefined' ? document.title : ''),
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
    });
  }

  public trackViewProduct(product: Product): void {
    this.ensureInit();
    const ip = getVisitorIp();

    sendAnalytics('/analytics/event', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      eventType: 'view_product',
      path: `/product/${product.slug}`,
      payload: {
        productId: product.id,
        productNameAr: product.nameAr,
        productNameEn: product.nameEn,
        slug: product.slug,
        basePrice: product.basePrice,
        categoryId: product.categoryId,
        categoryName: product.category?.nameAr,
      },
    });
  }

  public trackAddToCart(item: CartItem): void {
    this.ensureInit();
    const ip = getVisitorIp();

    sendAnalytics('/analytics/event', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      eventType: 'add_to_cart',
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
      payload: {
        productId: item.product.id,
        productName: item.product.nameAr,
        variantId: item.variantId,
        sku: item.variant.sku,
        price: item.variant.price,
        quantity: item.quantity,
        color: item.selectedColor?.nameAr,
        size: item.selectedSize?.nameAr,
        totalPrice: Number(item.variant.price) * item.quantity,
      },
    });
  }

  public trackInitiateCheckout(items: CartItem[], totalAmount: number): void {
    this.ensureInit();
    const ip = getVisitorIp();

    sendAnalytics('/analytics/event', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      eventType: 'initiate_checkout',
      path: '/checkout',
      payload: {
        itemsCount: items.length,
        totalAmount,
        items: items.map((i) => ({
          name: i.product.nameAr,
          color: i.selectedColor?.nameAr,
          size: i.selectedSize?.nameAr,
          qty: i.quantity,
          price: i.variant.price,
        })),
      },
    });
  }

  public trackPurchase(order: Order): void {
    this.ensureInit();
    const ip = getVisitorIp();
    const traffic = getTrafficSource();

    sendAnalytics('/analytics/event', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      eventType: 'purchase',
      path: '/order/success',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        city: order.customerCity,
        appliedCoupon: order.appliedCoupon,
        utmSource: traffic.utmSource,
        utmCampaign: traffic.utmCampaign,
        itemsCount: order.items?.length || 0,
      },
    });
  }

  public trackAbandonedCart(items: CartItem[], totalValue: number): void {
    if (!items || items.length === 0) return;
    this.ensureInit();
    const ip = getVisitorIp();
    const device = getDeviceInfo();

    sendAnalytics('/analytics/abandoned-cart', {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: ip,
      deviceType: device.deviceType,
      items,
      itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
      totalValue,
    });
  }

  public getSessionContext() {
    this.ensureInit();
    return {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      ip: cachedIp || '127.0.0.1',
      ...getTrafficSource(),
    };
  }
}

export const analyticsTracker = new AnalyticsTracker();

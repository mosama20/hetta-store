import { CartItem, Product, Order } from '../types/index.js';
import { analyticsApi } from '../api/index.js';

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

// Fetch visitor IP with local cache (server enriches automatically via headers)
export async function getVisitorIp(): Promise<string> {
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

class AnalyticsTracker {
  private visitorId: string = '';
  private sessionId: string = '';
  private lastPath: string = '';
  private initialized = false;

  public async init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.visitorId = getOrGenerateId(VISITOR_ID_KEY, localStorage);
    this.sessionId = getOrGenerateId(SESSION_ID_KEY, sessionStorage);

    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }

    const ip = await getVisitorIp();
    const device = getDeviceInfo();
    const traffic = getTrafficSource();

    // Register initial session hit
    analyticsApi
      .recordHit({
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
      })
      .catch(() => {});
  }

  public async trackPageView(path: string, title?: string) {
    if (path === this.lastPath) return;
    this.lastPath = path;

    await this.init();
    const ip = await getVisitorIp();
    const device = getDeviceInfo();
    const traffic = getTrafficSource();

    // Keep session alive, update page views, pages visited, and duration
    analyticsApi
      .recordHit({
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
      })
      .catch(() => {});

    analyticsApi
      .recordEvent({
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        ipAddress: ip,
        eventType: 'page_view',
        path,
        payload: {
          title: title || document.title,
          url: window.location.href,
        },
      })
      .catch(() => {});
  }

  public async trackViewProduct(product: Product) {
    await this.init();
    const ip = await getVisitorIp();

    analyticsApi
      .recordEvent({
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
      })
      .catch(() => {});
  }

  public async trackAddToCart(item: CartItem) {
    await this.init();
    const ip = await getVisitorIp();

    analyticsApi
      .recordEvent({
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        ipAddress: ip,
        eventType: 'add_to_cart',
        path: window.location.pathname,
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
      })
      .catch(() => {});
  }

  public async trackInitiateCheckout(items: CartItem[], totalAmount: number) {
    await this.init();
    const ip = await getVisitorIp();

    analyticsApi
      .recordEvent({
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
      })
      .catch(() => {});
  }

  public async trackPurchase(order: Order) {
    await this.init();
    const ip = await getVisitorIp();
    const traffic = getTrafficSource();

    analyticsApi
      .recordEvent({
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
      })
      .catch(() => {});
  }

  public async trackAbandonedCart(items: CartItem[], totalValue: number) {
    if (!items || items.length === 0) return;
    await this.init();
    const ip = await getVisitorIp();
    const device = getDeviceInfo();

    analyticsApi
      .recordAbandonedCart({
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        ipAddress: ip,
        deviceType: device.deviceType,
        items,
        itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
        totalValue,
      })
      .catch(() => {});
  }

  public getSessionContext() {
    return {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      ip: cachedIp || '127.0.0.1',
      ...getTrafficSource(),
    };
  }
}

export const analyticsTracker = new AnalyticsTracker();

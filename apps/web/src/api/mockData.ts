import {
  Category,
  Color,
  Size,
  Product,
  Order,
  StoreSettings,
  CMSSection,
  Discount,
  User,
} from '../types/index.js';

export const INITIAL_COLORS: Color[] = [
  { id: 'col-black', nameAr: 'أسود', nameEn: 'Black', hexCode: '#18181b', displayOrder: 1, isActive: true },
  { id: 'col-white', nameAr: 'أبيض', nameEn: 'White', hexCode: '#ffffff', displayOrder: 2, isActive: true },
  { id: 'col-beige', nameAr: 'بيج', nameEn: 'Beige', hexCode: '#d4b996', displayOrder: 3, isActive: true },
  { id: 'col-grey', nameAr: 'رمادي', nameEn: 'Grey', hexCode: '#6b7280', displayOrder: 4, isActive: true },
  { id: 'col-navy', nameAr: 'كحلي', nameEn: 'Navy', hexCode: '#1e293b', displayOrder: 5, isActive: true },
  { id: 'col-green', nameAr: 'زيتي', nameEn: 'Olive', hexCode: '#445138', displayOrder: 6, isActive: true },
];

export const INITIAL_SIZES: Size[] = [
  { id: 'sz-s', nameAr: 'S', nameEn: 'S', displayOrder: 1, isActive: true },
  { id: 'sz-m', nameAr: 'M', nameEn: 'M', displayOrder: 2, isActive: true },
  { id: 'sz-l', nameAr: 'L', nameEn: 'L', displayOrder: 3, isActive: true },
  { id: 'sz-xl', nameAr: 'XL', nameEn: 'XL', displayOrder: 4, isActive: true },
  { id: 'sz-xxl', nameAr: '2XL', nameEn: '2XL', displayOrder: 5, isActive: true },
  { id: 'sz-one', nameAr: 'مقاس موحد', nameEn: 'One Size', displayOrder: 6, isActive: true },
];

// Clean Slate: No mock categories (user creates their own in /admin/categories)
export const INITIAL_CATEGORIES: Category[] = [];

// Clean Slate: No mock products (user creates their own in /admin/products or imports Excel)
export const INITIAL_PRODUCTS: Product[] = [];

// Clean Slate: No mock orders (orders generated when customers purchase)
export const INITIAL_ORDERS: Order[] = [];

// Clean Slate: Default dynamic settings
export const INITIAL_SETTINGS: StoreSettings = {
  store_name_ar: 'متجري',
  store_name_en: 'My Store',
  currency: 'EGP',
  whatsapp_number: '',
  whatsapp_order_template_ar: 'مرحباً، أود تأكيد طلبي رقم {orderNumber} بقيمة {totalAmount} {currency}.',
  support_email: '',
  announcement_bar_enabled: 'true',
  announcement_text_ar: '🔥 خصومات وعروض حصرية لفترة محدودة | 🚚 شحن سريع لكافة محافظات مصر | ⚡ دفع عند الاستلام مع المعاينة',
  announcement_text_en: '🔥 Exclusive Limited-Time Offers | 🚚 Fast Delivery Across Egypt | ⚡ Cash on Delivery with Inspection',
  announcement_link: '/shop',
  announcement_coupon: 'WELCOME10',
};

// Clean Slate: No mock discounts (user creates in /admin/discounts)
export const INITIAL_DISCOUNTS: Discount[] = [];

// Clean Slate: CMS Sections (customizable by user in /admin/cms)
export const INITIAL_CMS_SECTIONS: CMSSection[] = [
  {
    id: 'cms-hero',
    key: 'hero_banner',
    type: 'HERO',
    titleAr: 'أهلاً بكم في متجرنا',
    titleEn: 'Welcome to Our Store',
    subtitleAr: 'اكتشف أحدث التشكيلات العصرية بأعلى معايير الجودة والتصميم.',
    subtitleEn: 'Discover our latest premium collection crafted with top quality standards.',
    payload: {
      imageUrl: '',
      badgeAr: 'تشكيلة جديدة',
      badgeEn: 'NEW ARRIVALS',
      ctaTextAr: 'تسوق الآن',
      ctaTextEn: 'Shop Now',
      ctaLink: '/shop',
    },
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cms-marquee',
    key: 'marquee_ticker',
    type: 'MARQUEE',
    titleAr: 'شريط الكلمات المتحرك',
    titleEn: 'Animated Marquee Ticker',
    subtitleAr: 'جودة استثنائية • شحن سريع • دفع عند الاستلام • خامات قطنية 100%',
    subtitleEn: 'PREMIUM QUALITY • FAST SHIPPING • CASH ON DELIVERY • 100% COMBED COTTON',
    payload: {},
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'cms-categories',
    key: 'categories_section',
    type: 'CATEGORIES',
    titleAr: 'تصفح حسب القسم',
    titleEn: 'Shop by Category',
    subtitleAr: '',
    subtitleEn: '',
    payload: {
      viewAllTextAr: 'عرض الكل',
      viewAllTextEn: 'View All',
    },
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cms-trust',
    key: 'trust_bar',
    type: 'TRUST_BAR',
    titleAr: 'شريط مميزات المتجر والضمانات',
    titleEn: 'Store Guarantees & Features',
    subtitleAr: '',
    subtitleEn: '',
    payload: {},
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'cms-new-arrivals',
    key: 'new_arrivals',
    type: 'NEW_ARRIVALS',
    titleAr: 'أحدث المنتجات',
    titleEn: 'New Arrivals',
    subtitleAr: 'المعروضات',
    subtitleEn: 'EXPLORE',
    payload: {
      badgeAr: 'جديدنا',
      badgeEn: 'NEW DROPS',
      limit: 12,
    },
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 'cms-promo',
    key: 'promo_banner',
    type: 'PROMO_BANNER',
    titleAr: 'عرض خاص ومحدود',
    titleEn: 'Special Limited Offer',
    subtitleAr: 'احصل على خصومات حصرية وتوصيل سريع لباب بيتك عند طلبك اليوم.',
    subtitleEn: 'Get exclusive discounts and express doorstep delivery when you order today.',
    payload: {
      badgeAr: 'عرض الموسم',
      badgeEn: 'SPECIAL PROMO',
      ctaTextAr: 'تسوق العرض الآن',
      ctaTextEn: 'Shop Offer Now',
      ctaLink: '/shop',
      imageUrl: '',
    },
    displayOrder: 6,
    isActive: true,
  },
  {
    id: 'cms-about',
    key: 'about_section',
    type: 'ABOUT',
    titleAr: 'عن علامتنا التجارية',
    titleEn: 'About Our Brand',
    subtitleAr: 'نقدم لك أفضل التصاميم العصرية بخامات قطنية ممتازة وتفاصيل مصممة لراحتك وتألقك اليومي.',
    subtitleEn: 'We deliver modern premium fashion with finest fabrics crafted for your daily comfort and confidence.',
    payload: {},
    displayOrder: 7,
    isActive: true,
  },
];

// Admin user for logging into dashboard
export const INITIAL_USER: User = {
  id: 'usr-admin-1',
  email: 'admin@fashionstore.com',
  fullName: 'مدير المتجر (Admin)',
  phone: '+201000000000',
  isActive: true,
  roles: ['SUPER_ADMIN'],
  permissions: ['*'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

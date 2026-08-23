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
  announcement_bar_enabled: 'false',
  announcement_text_ar: '',
  announcement_text_en: '',
  announcement_link: '/shop',
  announcement_coupon: '',
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
    subtitleAr: 'أحدث التشكيلات العصرية بأعلى جودة.',
    subtitleEn: 'Discover our latest premium collection.',
    payload: {
      ctaTextAr: 'تسوق الآن',
      ctaTextEn: 'Shop Now',
      ctaLink: '/shop',
      badgeAr: 'تشكيلة جديدة',
      badgeEn: 'NEW ARRIVALS',
    },
    displayOrder: 1,
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

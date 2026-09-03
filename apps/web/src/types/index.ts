export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  roles: string[] | { id: string; name: string; displayNameAr: string; displayNameEn: string }[];
  permissions: string[];
}

export interface Color {
  id: string;
  nameAr: string;
  nameEn: string;
  hexCode: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Size {
  id: string;
  nameAr: string;
  nameEn: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
  children?: Category[];
  parent?: Category;
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorId: string;
  sizeId: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  color: Color;
  size: Size;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altTextAr?: string;
  altTextEn?: string;
  colorId?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  basePrice: number;
  isFeatured: boolean;
  isActive: boolean;
  seoTitleAr?: string;
  seoTitleEn?: string;
  seoDescAr?: string;
  seoDescEn?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface CartItem {
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  selectedColor: Color;
  selectedSize: Size;
}

export type OrderStatus =
  'PENDING' | 'CONTACTED' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId?: string;
  skuSnapshot: string;
  productNameAr: string;
  productNameEn: string;
  colorNameAr: string;
  colorNameEn: string;
  sizeNameAr: string;
  sizeNameEn: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  customerAddress?: string;
  notes?: string;
  status: OrderStatus;
  subtotal?: number;
  discountAmount?: number;
  discountPercent?: number;
  appliedCoupon?: string;
  shippingFee?: number;
  totalAmount: number;
  currency: string;
  whatsappMessage?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CMSSection {
  id: string;
  key: string;
  type: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  payload: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
}

export interface Discount {
  id: string;
  nameAr: string;
  nameEn: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  applyToAll: boolean;
  discountProducts?: { product: Product }[];
  discountCategories?: { category: Category }[];
}

export interface StoreSettings {
  store_name_ar?: string;
  store_name_en?: string;
  store_title_ar?: string;
  store_title_en?: string;
  store_logo?: string;
  favicon_url?: string;
  currency?: string;
  whatsapp_number?: string;
  whatsapp_order_template_ar?: string;
  social_links?: string;
  support_email?: string;
  // SHEIN Concierge Settings
  shein_enabled?: string;
  shein_shipping_fee?: string;
  shein_service_fee?: string;
  shein_delivery_fee?: string;
  shein_exchange_rate?: string;
  shein_estimated_days?: string;
  announcement_bar_enabled?: string;
  announcement_text_ar?: string;
  announcement_text_en?: string;
  announcement_link?: string;
  announcement_coupon?: string;
  announcement_style?: string;
  [key: string]: string | undefined;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  totalOrders: number;
  pendingOrders: number;
  contactedOrders?: number;
  confirmedOrders?: number;
  processingOrders?: number;
  completedOrders: number;
  cancelledOrders?: number;
  totalCategories: number;
  totalUsers: number;
  totalRevenue: number;
  completedRevenue?: number;
  todayRevenue?: number;
  todayOrdersCount?: number;
  averageOrderValue?: number;
  currency: string;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerCity?: string;
    totalAmount: number;
    currency: string;
    status: OrderStatus;
    createdAt: string;
  }[];
  recentProducts: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
    basePrice: number;
    isActive: boolean;
    createdAt: string;
    images: { url: string }[];
  }[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface VisitorSession {
  id: string;
  visitorId: string;
  ipAddress: string;
  country?: string;
  city?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  screenResolution?: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  pagesVisited: string[];
  totalPageViews: number;
  durationSeconds: number;
  hasOrder: boolean;
  orderNumber?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  visitorId: string;
  ipAddress: string;
  eventType:
    | 'page_view'
    | 'view_product'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'initiate_checkout'
    | 'purchase'
    | 'abandoned_cart';
  path: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface AbandonedCart {
  id: string;
  sessionId: string;
  visitorId: string;
  ipAddress: string;
  deviceType: string;
  items: CartItem[];
  itemsCount: number;
  totalValue: number;
  currency: string;
  lastActiveAt: string;
  createdAt: string;
  isRecovered: boolean;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  uniqueVisitorsToday: number;
  uniqueVisitorsThisWeek: number;
  liveVisitorsNow: number;
  totalPageViews: number;
  bounceRate: number;
  avgSessionDurationSeconds: number;
  abandonedCartsCount: number;
  abandonedCartsValue: number;
  topVisitedPages: { path: string; views: number }[];
  topViewedProducts: { productId: string; nameAr: string; views: number; addToCartCount: number }[];
  trafficSources: { source: string; visitors: number; percentage: number; ordersCount: number }[];
  campaigns: { campaign: string; source: string; visitors: number; ordersCount: number; revenue: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  osBreakdown: { os: string; count: number; percentage: number }[];
  browserBreakdown: { browser: string; count: number; percentage: number }[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  payload?: Record<string, unknown>;
  user?: { id?: string; fullName?: string; email?: string };
  ipAddress?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type SheinOrderStatus = 'PENDING' | 'CONFIRMED' | 'PURCHASED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface SheinOrderItem {
  id?: string;
  productUrl: string;
  title: string;
  imageUrl?: string | null;
  color?: string | null;
  size?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export interface SheinOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string | null;
  customerDistrict?: string | null;
  customerAddress?: string | null;
  paymentMethod: string;
  notes?: string | null;
  status: SheinOrderStatus;
  productsTotal: number;
  sheinShippingFee: number;
  serviceFee: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: SheinOrderItem[];
}

export interface SheinExtractResult {
  success: boolean;
  url: string;
  goodsId?: string;
  title: string;
  imageUrl?: string | null;
  images?: string[];
  originalPrice: number;
  currency: string;
  estimatedPriceEgp: number;
  sizes: string[];
  message?: string;
}

export interface SheinPricingConfig {
  enabled: boolean;
  shippingFee: number;
  serviceFee: number;
  deliveryFee: number;
  exchangeRate: number;
  estimatedDays: string;
  whatsappNumber: string;
}



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
  currency?: string;
  whatsapp_number?: string;
  whatsapp_order_template_ar?: string;
  social_links?: string;
  support_email?: string;
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
  completedOrders: number;
  totalCategories: number;
  totalUsers: number;
  totalRevenue: number;
  currency: string;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
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

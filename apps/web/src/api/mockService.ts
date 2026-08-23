import {
  Category,
  Color,
  Size,
  Product,
  ProductVariant,
  Order,
  OrderStatus,
  StoreSettings,
  CMSSection,
  Discount,
  User,
  DashboardStats,
  PaginatedResult,
} from '../types/index.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_COLORS,
  INITIAL_SIZES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_DISCOUNTS,
  INITIAL_CMS_SECTIONS,
  INITIAL_USER,
} from './mockData.js';

const STORAGE_KEY = 'fashion_store_production_db_v2';

interface MockDB {
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  discounts: Discount[];
  cmsSections: CMSSection[];
  users: User[];
  media: { id: string; url: string; mimeType: string; fileSize: number; createdAt: string }[];
  auditLogs: {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
    ipAddress?: string;
  }[];
}

function loadDB(): MockDB {
  if (typeof window === 'undefined') {
    return {
      categories: INITIAL_CATEGORIES,
      colors: INITIAL_COLORS,
      sizes: INITIAL_SIZES,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      settings: INITIAL_SETTINGS,
      discounts: INITIAL_DISCOUNTS,
      cmsSections: INITIAL_CMS_SECTIONS,
      users: [INITIAL_USER],
      media: [],
      auditLogs: [],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: MockDB = {
        categories: INITIAL_CATEGORIES,
        colors: INITIAL_COLORS,
        sizes: INITIAL_SIZES,
        products: INITIAL_PRODUCTS,
        orders: INITIAL_ORDERS,
        settings: INITIAL_SETTINGS,
        discounts: INITIAL_DISCOUNTS,
        cmsSections: INITIAL_CMS_SECTIONS,
        users: [INITIAL_USER],
        media: [],
        auditLogs: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return {
      categories: INITIAL_CATEGORIES,
      colors: INITIAL_COLORS,
      sizes: INITIAL_SIZES,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      settings: INITIAL_SETTINGS,
      discounts: INITIAL_DISCOUNTS,
      cmsSections: INITIAL_CMS_SECTIONS,
      users: [INITIAL_USER],
      media: [],
      auditLogs: [],
    };
  }
}

import { triggerStoreSync } from '../store/settingsStore.js';

function saveDB(db: MockDB) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    triggerStoreSync();
  }
}

function applyActiveDiscounts(product: Product, discounts: Discount[]): Product {
  const activeDiscounts = discounts.filter((d) => d.isActive);
  if (activeDiscounts.length === 0) return product;

  // Find matching discount
  const matchingDiscount = activeDiscounts.find((d) => {
    if (d.applyToAll) return true;
    if (d.discountCategories?.some((dc) => dc.category?.id === product.categoryId || (dc as any).categoryId === product.categoryId)) return true;
    if (d.discountProducts?.some((dp) => dp.product?.id === product.id || (dp as any).productId === product.id)) return true;
    return false;
  });

  if (!matchingDiscount) return product;

  const originalBasePrice = Number(product.basePrice);
  let effectiveBasePrice = originalBasePrice;

  if (matchingDiscount.type === 'PERCENTAGE') {
    effectiveBasePrice = Math.round(originalBasePrice * (1 - Number(matchingDiscount.value) / 100));
  } else {
    effectiveBasePrice = Math.max(0, originalBasePrice - Number(matchingDiscount.value));
  }

  const updatedVariants = product.variants.map((v) => {
    const origVPrice = Number(v.price);
    let effectiveVPrice = origVPrice;
    if (matchingDiscount.type === 'PERCENTAGE') {
      effectiveVPrice = Math.round(origVPrice * (1 - Number(matchingDiscount.value) / 100));
    } else {
      effectiveVPrice = Math.max(0, origVPrice - Number(matchingDiscount.value));
    }
    return {
      ...v,
      price: effectiveVPrice,
      compareAtPrice: v.compareAtPrice || origVPrice,
    };
  });

  return {
    ...product,
    basePrice: effectiveBasePrice,
    variants: updatedVariants,
  };
}

export class MockService {
  // --- Auth ---
  static async login(credentials: { email: string; password?: string }) {
    const db = loadDB();
    const user = db.users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase()) || {
      ...INITIAL_USER,
      email: credentials.email,
    };
    return {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user,
    };
  }

  static async getMe(): Promise<User> {
    const db = loadDB();
    return db.users[0] || INITIAL_USER;
  }

  // --- Categories ---
  static async getCategories(all = false): Promise<Category[]> {
    const db = loadDB();
    return all ? db.categories : db.categories.filter((c) => c.isActive);
  }

  static async getCategoryBySlug(slug: string): Promise<Category> {
    const db = loadDB();
    const found = db.categories.find((c) => c.slug === slug);
    if (!found) {
      // Auto-fallback: if slug doesn't exist, generate a placeholder
      const generated: Category = {
        id: 'cat-' + slug,
        slug,
        nameAr: slug.charAt(0).toUpperCase() + slug.slice(1),
        nameEn: slug.charAt(0).toUpperCase() + slug.slice(1),
        displayOrder: 99,
        isActive: true,
      };
      return generated;
    }
    return found;
  }

  static async createCategory(data: Partial<Category>): Promise<Category> {
    const db = loadDB();
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      slug: data.slug || `cat-${Date.now()}`,
      nameAr: data.nameAr || 'قسم جديد',
      nameEn: data.nameEn || 'New Category',
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn,
      imageUrl: data.imageUrl,
      displayOrder: data.displayOrder || db.categories.length + 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    db.categories.push(newCat);
    saveDB(db);
    return newCat;
  }

  static async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const db = loadDB();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...data };
      saveDB(db);
      return db.categories[idx];
    }
    throw new Error('Category not found');
  }

  static async deleteCategory(id: string) {
    const db = loadDB();
    db.categories = db.categories.filter((c) => c.id !== id);
    saveDB(db);
    return { message: 'Deleted successfully' };
  }

  // --- Attributes ---
  static async getColors(): Promise<Color[]> {
    const db = loadDB();
    return db.colors.filter((c) => c.isActive);
  }

  static async createColor(data: { nameAr: string; nameEn: string; hexCode: string; displayOrder?: number }): Promise<Color> {
    const db = loadDB();
    const newCol: Color = {
      id: 'col-' + Date.now(),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      hexCode: data.hexCode,
      displayOrder: data.displayOrder || db.colors.length + 1,
      isActive: true,
    };
    db.colors.push(newCol);
    saveDB(db);
    return newCol;
  }

  static async updateColor(id: string, data: Partial<Color>): Promise<Color> {
    const db = loadDB();
    const idx = db.colors.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.colors[idx] = { ...db.colors[idx], ...data };
      saveDB(db);
      return db.colors[idx];
    }
    throw new Error('Color not found');
  }

  static async getSizes(): Promise<Size[]> {
    const db = loadDB();
    return db.sizes.filter((s) => s.isActive);
  }

  static async createSize(data: { nameAr: string; nameEn: string; displayOrder?: number }): Promise<Size> {
    const db = loadDB();
    const newSize: Size = {
      id: 'sz-' + Date.now(),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      displayOrder: data.displayOrder || db.sizes.length + 1,
      isActive: true,
    };
    db.sizes.push(newSize);
    saveDB(db);
    return newSize;
  }

  static async updateSize(id: string, data: Partial<Size>): Promise<Size> {
    const db = loadDB();
    const idx = db.sizes.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.sizes[idx] = { ...db.sizes[idx], ...data };
      saveDB(db);
      return db.sizes[idx];
    }
    throw new Error('Size not found');
  }

  // --- Products ---
  static async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    colorId?: string;
    sizeId?: string;
    minPrice?: number;
    maxPrice?: number;
    isFeatured?: boolean;
    inStock?: boolean;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
    all?: boolean;
  }): Promise<PaginatedResult<Product>> {
    const db = loadDB();
    let filtered = allItems(db.products);

    if (!params?.all) {
      filtered = filtered.filter((p) => p.isActive);
    }

    if (params?.category) {
      filtered = filtered.filter(
        (p) => p.category?.slug === params.category || p.categoryId === params.category,
      );
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.descriptionAr?.toLowerCase().includes(q) ||
          p.descriptionEn?.toLowerCase().includes(q),
      );
    }

    if (params?.colorId) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.colorId === params.colorId && v.isActive),
      );
    }

    if (params?.sizeId) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.sizeId === params.sizeId && v.isActive),
      );
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.basePrice >= (params.minPrice || 0));
    }

    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.basePrice <= (params.maxPrice || Infinity));
    }

    // Sort
    if (params?.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.basePrice - b.basePrice);
    } else if (params?.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.basePrice - a.basePrice);
    } else {
      // Default: newest
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 12;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const rawItems = filtered.slice(startIndex, startIndex + limit);
    const items = rawItems.map((p) => applyActiveDiscounts(p, db.discounts));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  static async getProductBySlug(slug: string): Promise<Product> {
    const db = loadDB();
    const found = db.products.find((p) => p.slug === slug);
    if (!found) {
      // Return first product as fallback
      if (db.products.length > 0) {
        return applyActiveDiscounts(db.products[0], db.discounts);
      }
      throw new Error('Product not found');
    }
    return applyActiveDiscounts(found, db.discounts);
  }

  static async getProductById(id: string): Promise<Product> {
    const db = loadDB();
    const found = db.products.find((p) => p.id === id);
    if (!found) {
      if (db.products.length > 0) return applyActiveDiscounts(db.products[0], db.discounts);
      throw new Error('Product not found');
    }
    return applyActiveDiscounts(found, db.discounts);
  }

  static async createProduct(data: any): Promise<Product> {
    const db = loadDB();
    const category = db.categories.find((c) => c.id === data.categoryId) || db.categories[0];
    const newProd: Product = {
      id: 'prod-' + Date.now(),
      categoryId: data.categoryId || category?.id || 'cat-tshirts',
      category,
      nameAr: data.nameAr || 'منتج جديد',
      nameEn: data.nameEn || 'New Product',
      slug: data.slug || `prod-${Date.now()}`,
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn,
      basePrice: Number(data.basePrice) || 500,
      isFeatured: !!data.isFeatured,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: data.images || [
        {
          id: 'img-' + Date.now(),
          productId: 'prod-' + Date.now(),
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          displayOrder: 1,
          isPrimary: true,
        },
      ],
      variants: data.variants || [
        {
          id: 'var-' + Date.now(),
          productId: 'prod-' + Date.now(),
          colorId: db.colors[0]?.id || 'col-black',
          sizeId: db.sizes[1]?.id || 'sz-m',
          sku: `CRF-${Date.now()}`,
          price: Number(data.basePrice) || 500,
          stockQuantity: 20,
          lowStockThreshold: 5,
          isActive: true,
          color: db.colors[0] || INITIAL_COLORS[0],
          size: db.sizes[1] || INITIAL_SIZES[1],
        },
      ],
    };
    db.products.unshift(newProd);
    saveDB(db);
    return newProd;
  }

  static async updateProduct(id: string, data: any): Promise<Product> {
    const db = loadDB();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const category = data.categoryId
        ? db.categories.find((c) => c.id === data.categoryId)
        : db.products[idx].category;

      db.products[idx] = {
        ...db.products[idx],
        ...data,
        category,
        updatedAt: new Date().toISOString(),
      };
      saveDB(db);
      return db.products[idx];
    }
    throw new Error('Product not found');
  }

  static async deleteProduct(id: string) {
    const db = loadDB();
    db.products = db.products.filter((p) => p.id !== id);
    saveDB(db);
    return { message: 'Product deleted' };
  }

  static async adjustStock(variantId: string, quantityChange: number): Promise<ProductVariant> {
    const db = loadDB();
    for (const prod of db.products) {
      const variant = prod.variants.find((v) => v.id === variantId);
      if (variant) {
        variant.stockQuantity = Math.max(0, variant.stockQuantity + quantityChange);
        saveDB(db);
        return variant;
      }
    }
    throw new Error('Variant not found');
  }

  static async bulkImport(items: any[]): Promise<{ success: boolean; importedCount: number }> {
    const db = loadDB();
    let count = 0;

    for (const item of items) {
      const category = db.categories.find(
        (c) => c.nameAr === item.categoryName || c.nameEn === item.categoryName || c.id === item.categoryId,
      ) || db.categories[0];

      const newProd: Product = {
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        categoryId: category ? category.id : 'cat-tshirts',
        category,
        nameAr: item.nameAr || 'منتج مستورد',
        nameEn: item.nameEn || 'Imported Product',
        slug: (item.nameEn || 'prod').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
        basePrice: Number(item.basePrice) || 500,
        isFeatured: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: item.imageUrl ? [{ id: 'img-' + Date.now(), productId: 'prod-0', url: item.imageUrl, displayOrder: 1, isPrimary: true }] : [{ id: 'img-' + Date.now(), productId: 'prod-0', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80', displayOrder: 1, isPrimary: true }],
        variants: [
          {
            id: 'var-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            productId: 'prod-0',
            colorId: db.colors[0]?.id || 'col-black',
            sizeId: db.sizes[1]?.id || 'sz-m',
            sku: item.sku || `CRF-IMP-${Date.now()}`,
            price: Number(item.basePrice) || 500,
            stockQuantity: Number(item.stockQuantity) || 20,
            lowStockThreshold: 5,
            isActive: true,
            color: db.colors[0],
            size: db.sizes[1],
          },
        ],
      };

      db.products.unshift(newProd);
      count++;
    }

    saveDB(db);
    return { success: true, importedCount: count };
  }

  // --- Orders ---
  static async getOrders(params?: { page?: number; limit?: number; status?: OrderStatus; search?: string }): Promise<PaginatedResult<Order>> {
    const db = loadDB();
    let filtered = [...db.orders];

    if (params?.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q),
      );
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const items = filtered.slice((page - 1) * limit, page * limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  static async getOrderById(id: string): Promise<Order> {
    const db = loadDB();
    const found = db.orders.find((o) => o.id === id);
    if (!found) {
      if (db.orders.length > 0) return db.orders[0];
      throw new Error('Order not found');
    }
    return found;
  }

  static async createOrder(data: {
    customerName: string;
    customerPhone: string;
    customerCity?: string;
    customerAddress?: string;
    notes?: string;
    items: { variantId: string; quantity: number }[];
  }) {
    const db = loadDB();
    const orderNumber = `CRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalAmount = 0;
    const orderItems: any[] = [];

    data.items.forEach((it, idx) => {
      let foundVariant: ProductVariant | undefined;
      let foundProduct: Product | undefined;

      for (const p of db.products) {
        const v = p.variants.find((vr) => vr.id === it.variantId);
        if (v) {
          foundVariant = v;
          foundProduct = p;
          break;
        }
      }

      const unitPrice = foundVariant ? Number(foundVariant.price) : 500;
      const subtotal = unitPrice * it.quantity;
      totalAmount += subtotal;

      orderItems.push({
        id: `ord-it-${Date.now()}-${idx}`,
        orderId: `ord-${Date.now()}`,
        variantId: it.variantId,
        skuSnapshot: foundVariant?.sku || 'SKU-000',
        productNameAr: foundProduct?.nameAr || 'منتج',
        productNameEn: foundProduct?.nameEn || 'Product',
        colorNameAr: foundVariant?.color.nameAr || '',
        colorNameEn: foundVariant?.color.nameEn || '',
        sizeNameAr: foundVariant?.size.nameAr || '',
        sizeNameEn: foundVariant?.size.nameEn || '',
        unitPrice,
        quantity: it.quantity,
        subtotal,
      });
    });

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerCity: data.customerCity,
      customerAddress: data.customerAddress,
      notes: data.notes,
      status: 'PENDING',
      totalAmount,
      currency: db.settings.currency || 'EGP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItems,
    };

    db.orders.unshift(newOrder);
    saveDB(db);

    const whatsappNumber = (db.settings.whatsapp_number || '+201234567890').replace(/[^0-9]/g, '');
    const itemsSummary = orderItems.map((i) => `• ${i.productNameAr} (${i.sizeNameEn} - ${i.colorNameAr}) x${i.quantity} = ${i.subtotal} ج.م`).join('\n');
    const msg = `مرحباً، أود تأكيد الطلب رقم *${orderNumber}*\n\nالاسم: ${data.customerName}\nالهاتف: ${data.customerPhone}\nالعنوان: ${data.customerCity || ''} ${data.customerAddress || ''}\n\nالمنتجات:\n${itemsSummary}\n\nالإجمالي: *${totalAmount} ج.م*`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    return {
      order: newOrder,
      whatsappUrl,
      whatsappMessage: msg,
    };
  }

  static async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const db = loadDB();
    const idx = db.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      db.orders[idx].status = status;
      db.orders[idx].updatedAt = new Date().toISOString();
      saveDB(db);
      return db.orders[idx];
    }
    throw new Error('Order not found');
  }

  // --- Settings ---
  static async getPublicSettings(): Promise<StoreSettings> {
    const db = loadDB();
    return { ...INITIAL_SETTINGS, ...(db.settings || {}) };
  }

  static async getAllSettings(): Promise<{ id: string; key: string; value: string; group: string }[]> {
    const db = loadDB();
    const merged = { ...INITIAL_SETTINGS, ...(db.settings || {}) };
    return Object.entries(merged).map(([key, value], idx) => ({
      id: 'set-' + idx,
      key,
      value: value !== undefined && value !== null ? String(value) : '',
      group: 'GENERAL',
    }));
  }

  static async updateSetting(key: string, value: string) {
    const db = loadDB();
    if (!db.settings) db.settings = { ...INITIAL_SETTINGS };
    db.settings[key] = value;
    saveDB(db);
    return { success: true };
  }

  // --- CMS ---
  static async getCmsSections(): Promise<CMSSection[]> {
    const db = loadDB();
    return db.cmsSections;
  }

  static async updateCmsSection(key: string, data: any): Promise<CMSSection> {
    const db = loadDB();
    const idx = db.cmsSections.findIndex((s) => s.key === key);
    if (idx !== -1) {
      db.cmsSections[idx] = { ...db.cmsSections[idx], ...data };
      saveDB(db);
      return db.cmsSections[idx];
    }
    throw new Error('Section not found');
  }

  // --- Discounts ---
  static async getDiscounts(all = false): Promise<Discount[]> {
    const db = loadDB();
    return all ? db.discounts : db.discounts.filter((d) => d.isActive);
  }

  static async createDiscount(data: any): Promise<Discount> {
    const db = loadDB();
    const newDisc: Discount = {
      id: 'disc-' + Date.now(),
      nameAr: data.nameAr || 'خصم جديد',
      nameEn: data.nameEn || 'New Discount',
      type: data.type || 'PERCENTAGE',
      value: Number(data.value) || 10,
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate,
      isActive: true,
      applyToAll: !!data.applyToAll,
    };
    db.discounts.push(newDisc);
    saveDB(db);
    return newDisc;
  }

  static async deleteDiscount(id: string) {
    const db = loadDB();
    db.discounts = db.discounts.filter((d) => d.id !== id);
    saveDB(db);
    return { message: 'Discount deleted' };
  }

  // --- Users ---
  static async getUsers(_params?: any): Promise<PaginatedResult<User>> {
    const db = loadDB();
    return {
      items: db.users,
      total: db.users.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  static async getRoles() {
    return [
      { id: 'r-1', name: 'SUPER_ADMIN', displayNameAr: 'مدير عام', displayNameEn: 'Super Admin' },
      { id: 'r-2', name: 'STORE_MANAGER', displayNameAr: 'مدير المتجر', displayNameEn: 'Store Manager' },
      { id: 'r-3', name: 'ORDER_FULFILLER', displayNameAr: 'مسؤول الطلبات', displayNameEn: 'Order Fulfiller' },
    ];
  }

  // --- Dashboard Stats ---
  static async getDashboardStats(): Promise<DashboardStats> {
    const db = loadDB();
    const totalOrders = db.orders.length;
    const completedOrders = db.orders.filter((o) => o.status === 'COMPLETED').length;
    const pendingOrders = db.orders.filter((o) => o.status === 'PENDING').length;
    const totalRevenue = db.orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    let lowStockCount = 0;
    db.products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.stockQuantity <= v.lowStockThreshold) {
          lowStockCount++;
        }
      });
    });

    return {
      totalProducts: db.products.length,
      activeProducts: db.products.filter((p) => p.isActive).length,
      lowStockCount,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCategories: db.categories.length,
      totalUsers: db.users.length,
      totalRevenue: totalRevenue || 1300,
      currency: db.settings.currency || 'EGP',
      recentOrders: db.orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
      })),
      recentProducts: db.products.slice(0, 5).map((p) => ({
        id: p.id,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        slug: p.slug,
        basePrice: p.basePrice,
        isActive: p.isActive,
        createdAt: p.createdAt,
        images: p.images.map((img) => ({ url: img.url })),
      })),
    };
  }

  // --- Media & Audit ---
  static async getMedia(_params?: any) {
    const db = loadDB();
    return {
      items: db.media,
      total: db.media.length,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  static async registerMedia(data: any) {
    const db = loadDB();
    const item = {
      id: 'med-' + Date.now(),
      url: data.url,
      mimeType: data.mimeType || 'image/jpeg',
      fileSize: data.fileSize || 102400,
      createdAt: new Date().toISOString(),
    };
    db.media.unshift(item);
    saveDB(db);
    return item;
  }

  static async deleteMedia(id: string) {
    const db = loadDB();
    db.media = db.media.filter((m) => m.id !== id);
    saveDB(db);
    return { message: 'Deleted' };
  }

  static async getAuditLogs(_params?: any) {
    const db = loadDB();
    return {
      items: db.auditLogs,
      total: db.auditLogs.length,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  // --- Backup & Restore ---
  static async exportBackup() {
    const db = loadDB();
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      store: db.settings?.store_name_ar || 'CRAFT',
      data: db,
    };
  }

  static async importBackup(payload: any) {
    if (!payload || (!payload.data && !payload.products)) {
      throw new Error('Invalid backup file structure');
    }

    const importedData: MockDB = payload.data || payload;

    const newDb: MockDB = {
      categories: Array.isArray(importedData.categories) ? importedData.categories : INITIAL_CATEGORIES,
      colors: Array.isArray(importedData.colors) ? importedData.colors : INITIAL_COLORS,
      sizes: Array.isArray(importedData.sizes) ? importedData.sizes : INITIAL_SIZES,
      products: Array.isArray(importedData.products) ? importedData.products : INITIAL_PRODUCTS,
      orders: Array.isArray(importedData.orders) ? importedData.orders : INITIAL_ORDERS,
      settings: importedData.settings ? { ...INITIAL_SETTINGS, ...importedData.settings } : INITIAL_SETTINGS,
      discounts: Array.isArray(importedData.discounts) ? importedData.discounts : INITIAL_DISCOUNTS,
      cmsSections: Array.isArray(importedData.cmsSections) ? importedData.cmsSections : INITIAL_CMS_SECTIONS,
      users: Array.isArray(importedData.users) ? importedData.users : [INITIAL_USER],
      media: Array.isArray(importedData.media) ? importedData.media : [],
      auditLogs: Array.isArray(importedData.auditLogs) ? importedData.auditLogs : [],
    };

    saveDB(newDb);
    return {
      success: true,
      message: 'Backup restored successfully',
      stats: {
        products: newDb.products.length,
        categories: newDb.categories.length,
        orders: newDb.orders.length,
        discounts: newDb.discounts.length,
      },
    };
  }

  static async resetToDefaults() {
    const initial: MockDB = {
      categories: INITIAL_CATEGORIES,
      colors: INITIAL_COLORS,
      sizes: INITIAL_SIZES,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      settings: INITIAL_SETTINGS,
      discounts: INITIAL_DISCOUNTS,
      cmsSections: INITIAL_CMS_SECTIONS,
      users: [INITIAL_USER],
      media: [],
      auditLogs: [],
    };
    saveDB(initial);
    return { success: true, message: 'Database reset to factory defaults' };
  }
}

function allItems<T>(arr: T[]): T[] {
  return [...arr];
}

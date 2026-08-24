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
  CartItem,
  AuditLog,
  VisitorSession,
  AnalyticsEvent,
  AbandonedCart,
  AnalyticsSummary,
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
import { triggerStoreSync } from '../store/settingsStore.js';

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
  auditLogs: AuditLog[];
  visitorSessions: VisitorSession[];
  analyticsEvents: AnalyticsEvent[];
  abandonedCarts: AbandonedCart[];
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
      visitorSessions: [],
      analyticsEvents: [],
      abandonedCarts: [],
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
        visitorSessions: [],
        analyticsEvents: [],
        abandonedCarts: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const existingCmsKeys = new Set((parsed.cmsSections || []).map((s: CMSSection) => s.key));
    const mergedCmsSections = [
      ...(parsed.cmsSections || []),
      ...INITIAL_CMS_SECTIONS.filter((s) => !existingCmsKeys.has(s.key)),
    ];
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES,
      colors: Array.isArray(parsed.colors) ? parsed.colors : INITIAL_COLORS,
      sizes: Array.isArray(parsed.sizes) ? parsed.sizes : INITIAL_SIZES,
      products: Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS,
      orders: Array.isArray(parsed.orders) ? parsed.orders : INITIAL_ORDERS,
      settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
      discounts: Array.isArray(parsed.discounts) ? parsed.discounts : INITIAL_DISCOUNTS,
      cmsSections: mergedCmsSections,
      users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : [INITIAL_USER],
      media: Array.isArray(parsed.media) ? parsed.media : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      visitorSessions: Array.isArray(parsed.visitorSessions) ? parsed.visitorSessions : [],
      analyticsEvents: Array.isArray(parsed.analyticsEvents) ? parsed.analyticsEvents : [],
      abandonedCarts: Array.isArray(parsed.abandonedCarts) ? parsed.abandonedCarts : [],
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
      visitorSessions: [],
      analyticsEvents: [],
      abandonedCarts: [],
    };
  }
}

function saveDB(db: MockDB) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    triggerStoreSync();
  }
}

function applyActiveDiscounts(product: Product, discounts: Discount[]): Product {
  const activeDiscounts = discounts.filter((d) => d.isActive);
  if (activeDiscounts.length === 0) return product;

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
  // --- Central Audit Logging Helper ---
  static addAuditLog(
    action: string,
    entity: string,
    entityId: string,
    details?: string,
    payload?: Record<string, unknown>,
    user?: { id?: string; fullName?: string; email?: string },
    ipAddress?: string,
  ) {
    try {
      const db = loadDB();
      const currentUser = user || (db.users.length ? { id: db.users[0].id, fullName: db.users[0].fullName, email: db.users[0].email } : { fullName: 'Admin / المدير' });
      
      const newLog: AuditLog = {
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        entity,
        entityId,
        details: details || `${action} on ${entity} (#${entityId})`,
        payload,
        user: currentUser,
        ipAddress: ipAddress || '127.0.0.1',
        createdAt: new Date().toISOString(),
      };

      db.auditLogs.unshift(newLog);
      // Keep up to 200 recent logs
      if (db.auditLogs.length > 200) {
        db.auditLogs = db.auditLogs.slice(0, 200);
      }
      saveDB(db);
    } catch {
      // Ignore logging failures
    }
  }

  // --- Auth ---
  static async login(credentials: { email: string; password?: string }) {
    const db = loadDB();
    const user = db.users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase()) || {
      ...INITIAL_USER,
      email: credentials.email,
    };
    MockService.addAuditLog('USER_LOGIN', 'AUTH', user.id, `User logged in: ${user.email}`, { email: user.email });
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
    MockService.addAuditLog('CREATE', 'CATEGORY', newCat.id, `Created category: ${newCat.nameAr}`, { category: newCat });
    return newCat;
  }

  static async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const db = loadDB();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...data };
      saveDB(db);
      MockService.addAuditLog('UPDATE', 'CATEGORY', id, `Updated category: ${db.categories[idx].nameAr}`, { updates: data });
      return db.categories[idx];
    }
    throw new Error('Category not found');
  }

  static async deleteCategory(id: string) {
    const db = loadDB();
    const cat = db.categories.find((c) => c.id === id);
    db.categories = db.categories.filter((c) => c.id !== id);
    saveDB(db);
    MockService.addAuditLog('DELETE', 'CATEGORY', id, `Deleted category: ${cat?.nameAr || id}`);
    return { message: 'Deleted successfully' };
  }

  // --- Attributes ---
  static async getColors(): Promise<Color[]> {
    const db = loadDB();
    return db.colors.filter((c) => c.isActive);
  }

  static async getSizes(): Promise<Size[]> {
    const db = loadDB();
    return db.sizes.filter((s) => s.isActive);
  }

  static async createColor(data: any): Promise<Color> {
    const db = loadDB();
    const newColor: Color = {
      id: 'col-' + Date.now(),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      hexCode: data.hexCode || '#000000',
      displayOrder: data.displayOrder || db.colors.length + 1,
      isActive: true,
    };
    db.colors.push(newColor);
    saveDB(db);
    MockService.addAuditLog('CREATE', 'COLOR', newColor.id, `Created color: ${newColor.nameAr}`);
    return newColor;
  }

  static async createSize(data: any): Promise<Size> {
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
    MockService.addAuditLog('CREATE', 'SIZE', newSize.id, `Created size: ${newSize.nameAr}`);
    return newSize;
  }

  // --- Products ---
  static async getProducts(params?: any): Promise<PaginatedResult<Product>> {
    const db = loadDB();
    let filtered = [...db.products];

    if (!params?.all) {
      filtered = filtered.filter((p) => p.isActive);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q)),
      );
    }

    if (params?.category) {
      filtered = filtered.filter(
        (p) => p.category?.slug === params.category || p.categoryId === params.category,
      );
    }

    if (params?.minPrice !== undefined && params.minPrice !== '') {
      filtered = filtered.filter((p) => p.basePrice >= Number(params.minPrice));
    }
    if (params?.maxPrice !== undefined && params.maxPrice !== '') {
      filtered = filtered.filter((p) => p.basePrice <= Number(params.maxPrice));
    }

    if (params?.isFeatured !== undefined) {
      const isF = params.isFeatured === 'true' || params.isFeatured === true;
      filtered = filtered.filter((p) => p.isFeatured === isF);
    }

    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.basePrice - b.basePrice);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.basePrice - a.basePrice);
          break;
        case 'popular':
          filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
        case 'newest':
        default:
          filtered.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          break;
      }
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
      categoryId: data.categoryId || category?.id || 'cat-default',
      category,
      nameAr: data.nameAr || 'منتج جديد',
      nameEn: data.nameEn || 'New Product',
      slug: data.slug || `product-${Date.now()}`,
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn,
      basePrice: Number(data.basePrice) || 0,
      isFeatured: !!data.isFeatured,
      isActive: data.isActive !== undefined ? data.isActive : true,
      seoTitleAr: data.seoTitleAr,
      seoTitleEn: data.seoTitleEn,
      seoDescAr: data.seoDescAr,
      seoDescEn: data.seoDescEn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: Array.isArray(data.images)
        ? data.images.map((img: any, idx: number) => ({
            id: 'img-' + Date.now() + '-' + idx,
            productId: 'prod-' + Date.now(),
            url: typeof img === 'string' ? img : img.url,
            isPrimary: idx === 0,
            displayOrder: idx + 1,
          }))
        : [],
      variants: Array.isArray(data.variants)
        ? data.variants.map((v: any, idx: number) => ({
            id: 'var-' + Date.now() + '-' + idx,
            productId: 'prod-' + Date.now(),
            colorId: v.colorId,
            sizeId: v.sizeId,
            sku: v.sku || `SKU-${Date.now()}-${idx}`,
            price: Number(v.price) || Number(data.basePrice) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
            stockQuantity: Number(v.stockQuantity) || 0,
            lowStockThreshold: Number(v.lowStockThreshold) || 5,
            isActive: v.isActive !== undefined ? v.isActive : true,
            color: db.colors.find((c) => c.id === v.colorId) || db.colors[0] || { id: 'col-1', nameAr: 'افتراضي', nameEn: 'Default', hexCode: '#000' },
            size: db.sizes.find((s) => s.id === v.sizeId) || db.sizes[0] || { id: 'sz-1', nameAr: 'موحد', nameEn: 'One Size' },
          }))
        : [],
    };

    db.products.unshift(newProd);
    saveDB(db);
    MockService.addAuditLog('CREATE', 'PRODUCT', newProd.id, `Created product: ${newProd.nameAr} (${newProd.basePrice} EGP)`, { product: newProd });
    return newProd;
  }

  static async updateProduct(id: string, data: any): Promise<Product> {
    const db = loadDB();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const existing = db.products[idx];
      const category = data.categoryId
        ? db.categories.find((c) => c.id === data.categoryId) || existing.category
        : existing.category;

      db.products[idx] = {
        ...existing,
        ...data,
        category,
        updatedAt: new Date().toISOString(),
      };
      saveDB(db);
      MockService.addAuditLog('UPDATE', 'PRODUCT', id, `Updated product: ${db.products[idx].nameAr}`, { updates: data });
      return db.products[idx];
    }
    throw new Error('Product not found');
  }

  static async deleteProduct(id: string) {
    const db = loadDB();
    const prod = db.products.find((p) => p.id === id);
    db.products = db.products.filter((p) => p.id !== id);
    saveDB(db);
    MockService.addAuditLog('DELETE', 'PRODUCT', id, `Deleted product: ${prod?.nameAr || id}`);
    return { message: 'Product deleted successfully' };
  }

  static async bulkImportProducts(products: any[]) {
    const db = loadDB();
    let importedCount = 0;
    products.forEach((p) => {
      const category = db.categories.find((c) => c.id === p.categoryId) || db.categories[0];
      const newProd: Product = {
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        categoryId: category?.id || 'cat-default',
        category,
        nameAr: p.nameAr || 'منتج مستورد',
        nameEn: p.nameEn || 'Imported Product',
        slug: p.slug || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        basePrice: Number(p.basePrice) || 0,
        isFeatured: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: Array.isArray(p.images)
          ? p.images.map((url: string, idx: number) => ({
              id: 'img-' + Date.now() + '-' + idx,
              productId: 'prod-' + Date.now(),
              url,
              isPrimary: idx === 0,
              displayOrder: idx + 1,
            }))
          : [],
        variants: Array.isArray(p.variants) ? p.variants : [],
      };
      db.products.unshift(newProd);
      importedCount++;
    });
    saveDB(db);
    MockService.addAuditLog('BULK_IMPORT', 'PRODUCT', 'bulk', `Imported ${importedCount} products in bulk`);
    return { count: importedCount, message: `Successfully imported ${importedCount} products` };
  }

  // --- Orders ---
  static async getOrders(params?: any): Promise<PaginatedResult<Order>> {
    const db = loadDB();
    let filtered = [...db.orders];

    if (params?.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q),
      );
    }

    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

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
    const found = db.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!found) throw new Error('Order not found');
    return found;
  }

  static async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const db = loadDB();
    const idx = db.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx !== -1) {
      const oldStatus = db.orders[idx].status;
      db.orders[idx].status = status;
      db.orders[idx].updatedAt = new Date().toISOString();
      saveDB(db);
      MockService.addAuditLog('UPDATE_STATUS', 'ORDER', id, `Changed order #${db.orders[idx].orderNumber} status from ${oldStatus} to ${status}`, { oldStatus, newStatus: status });
      return db.orders[idx];
    }
    throw new Error('Order not found');
  }

  static async createOrder(data: {
    customerName: string;
    customerPhone: string;
    customerCity?: string;
    customerAddress?: string;
    notes?: string;
    subtotal?: number;
    discountAmount?: number;
    discountPercent?: number;
    appliedCoupon?: string;
    shippingFee?: number;
    totalAmount?: number;
    items: { variantId: string; quantity: number }[];
  }): Promise<{ order: Order; whatsappUrl: string; whatsappMessage: string }> {
    const db = loadDB();
    const orderNumber = `CRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let computedSubtotal = 0;
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
      const subtotalItem = unitPrice * it.quantity;
      computedSubtotal += subtotalItem;

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
        subtotal: subtotalItem,
      });
    });

    const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : computedSubtotal;
    const discountPercent = data.discountPercent !== undefined ? Number(data.discountPercent) : 0;
    const discountAmount = data.discountAmount !== undefined
      ? Number(data.discountAmount)
      : Math.round((subtotal * discountPercent) / 100);
    const shippingFee = data.shippingFee !== undefined
      ? Number(data.shippingFee)
      : (subtotal >= 1000 ? 0 : 50);
    const totalAmount = data.totalAmount !== undefined
      ? Number(data.totalAmount)
      : Math.max(0, subtotal - discountAmount) + shippingFee;

    const currency = db.settings.currency || 'EGP';
    const storeName = db.settings.store_name_ar || 'متجري';
    const now = new Date();
    const orderDate = now.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      subtotal,
      discountAmount,
      discountPercent,
      appliedCoupon: data.appliedCoupon,
      shippingFee,
      totalAmount,
      currency,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: orderItems,
    };

    db.orders.unshift(newOrder);
    saveDB(db);

    // Build comprehensive itemized summary
    const itemsSummary = orderItems
      .map(
        (i, idx) =>
          `🔹 *${idx + 1}. ${i.productNameAr}*\n   • اللون: ${i.colorNameAr || '—'} | المقاس: ${i.sizeNameAr || '—'}\n   • الكمية: ${i.quantity} قطعة × ${i.unitPrice} ${currency} = *${i.subtotal} ${currency}*`,
      )
      .join('\n\n');

    const couponSection =
      discountAmount > 0
        ? `• *خصم الكوبون ${data.appliedCoupon ? `(${data.appliedCoupon})` : ''}:* -${discountAmount} ${currency}`
        : '';

    const notesSection = data.notes ? `• *ملاحظات التوصيل:* ${data.notes}` : '';

    const rawTemplate =
      db.settings.whatsapp_order_template_ar ||
      '🛍️ *تأكيد طلب جديد من متجر {storeName}*\n━━━━━━━━━━━━━━━━━━━━\n📦 *رقم الطلب:* #{orderNumber}\n📅 *تاريخ الطلب:* {orderDate}\n\n👤 *بيانات العميل:*\n• *الاسم:* {customerName}\n• *رقم الهاتف:* {customerPhone}\n• *المحافظة:* {city}\n• *العنوان التفصيلي:* {customerAddress}\n{notesSection}\n\n🛒 *تفاصيل المنتجات المطلوبة:*\n{itemsSummary}\n\n━━━━━━━━━━━━━━━━━━━━\n💰 *ملخص الفاتورة:*\n• *المجموع الفرعي:* {subtotal} {currency}\n{couponSection}\n• *تكلفة الشحن:* {shippingFee} {currency}\n━━━━━━━━━━━━━━━━━━━━\n💵 *الإجمالي النهائي المطلوب دفعه عند الاستلام:* \n👉 *{total} {currency}*\n━━━━━━━━━━━━━━━━━━━━\n🚚 *طريقة الدفع:* الدفع عند الاستلام (COD)\n\nيرجى تأكيد الطلب للبدء في تجهيز الشحن فوراً ⚡';

    const fullAddress = [data.customerCity, data.customerAddress].filter(Boolean).join(' - ') || 'غير محدد';

    const formattedMessage = rawTemplate
      .replace(/\{storeName\}/gi, storeName)
      .replace(/\{orderNumber\}/gi, orderNumber)
      .replace(/\{orderDate\}/gi, orderDate)
      .replace(/\{customerName\}/gi, data.customerName || '')
      .replace(/\{customerPhone\}/gi, data.customerPhone || '')
      .replace(/\{phone\}/gi, data.customerPhone || '')
      .replace(/\{customerAddress\}/gi, fullAddress)
      .replace(/\{address\}/gi, fullAddress)
      .replace(/\{city\}/gi, data.customerCity || 'غير محدد')
      .replace(/\{notesSection\}/gi, notesSection)
      .replace(/\{notes\}/gi, data.notes || 'لا يوجد')
      .replace(/\{itemsSummary\}/gi, itemsSummary)
      .replace(/\{items\}/gi, itemsSummary)
      .replace(/\{subtotal\}/gi, subtotal.toString())
      .replace(/\{couponSection\}/gi, couponSection)
      .replace(/\{discount\}/gi, discountAmount.toString())
      .replace(/\{shippingFee\}/gi, shippingFee === 0 ? 'مجاني 🔥' : `${shippingFee}`)
      .replace(/\{totalAmount\}/gi, totalAmount.toString())
      .replace(/\{total\}/gi, totalAmount.toString())
      .replace(/\{currency\}/gi, currency)
      .replace(/\{supportEmail\}/gi, db.settings.support_email || 'الدعم الفني');

    const cleanWaNumber = (db.settings.whatsapp_number || '+201012345678').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(formattedMessage)}`;

    MockService.addAuditLog(
      'CREATE',
      'ORDER',
      newOrder.id,
      `New order #${orderNumber} placed by ${data.customerName} for ${totalAmount} ${currency}`,
      { orderNumber, totalAmount, customerName: data.customerName, itemsCount: orderItems.length },
    );

    return {
      order: newOrder,
      whatsappUrl,
      whatsappMessage: formattedMessage,
    };
  }

  static async deleteOrder(id: string) {
    const db = loadDB();
    const ord = db.orders.find((o) => o.id === id);
    db.orders = db.orders.filter((o) => o.id !== id);
    saveDB(db);
    MockService.addAuditLog('DELETE', 'ORDER', id, `Deleted order #${ord?.orderNumber || id}`);
    return { message: 'Order deleted successfully' };
  }

  // --- Settings ---
  static async getSettings(): Promise<StoreSettings> {
    const db = loadDB();
    return db.settings;
  }

  static async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const db = loadDB();
    db.settings = { ...db.settings, ...settings };
    saveDB(db);
    MockService.addAuditLog('UPDATE', 'SETTINGS', 'global', 'Updated general store settings & branding', { settings });
    return db.settings;
  }

  static async updateSingleSetting(key: string, value: string, _category = 'GENERAL') {
    const db = loadDB();
    db.settings[key] = value;
    saveDB(db);
    MockService.addAuditLog('UPDATE', 'SETTINGS', key, `Updated setting '${key}'`, { key, value });
    return { key, value };
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
      MockService.addAuditLog('UPDATE', 'CMS', key, `Updated CMS section '${key}'`, { data });
      return db.cmsSections[idx];
    }
    const newSec: CMSSection = {
      id: 'cms-' + Date.now(),
      key,
      type: data.type || 'CUSTOM',
      titleAr: data.titleAr || '',
      titleEn: data.titleEn || '',
      subtitleAr: data.subtitleAr,
      subtitleEn: data.subtitleEn,
      payload: data.payload || {},
      displayOrder: data.displayOrder || db.cmsSections.length + 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    db.cmsSections.push(newSec);
    saveDB(db);
    MockService.addAuditLog('CREATE', 'CMS', key, `Created CMS section '${key}'`, { data });
    return newSec;
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
    MockService.addAuditLog('CREATE', 'DISCOUNT', newDisc.id, `Created discount '${newDisc.nameAr}' (${newDisc.value}%)`, { discount: newDisc });
    return newDisc;
  }

  static async deleteDiscount(id: string) {
    const db = loadDB();
    const d = db.discounts.find((disc) => disc.id === id);
    db.discounts = db.discounts.filter((disc) => disc.id !== id);
    saveDB(db);
    MockService.addAuditLog('DELETE', 'DISCOUNT', id, `Deleted discount '${d?.nameAr || id}'`);
    return { message: 'Discount deleted' };
  }

  // --- Users ---
  static async getUsers(params?: any): Promise<PaginatedResult<User>> {
    const db = loadDB();
    let filtered = [...db.users];

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)),
      );
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
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

  static async createUser(data: any): Promise<User> {
    const db = loadDB();
    const newUser: User = {
      id: 'usr-' + Date.now(),
      email: data.email || 'user@fashionstore.com',
      fullName: data.fullName || 'User',
      phone: data.phone || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      roles: data.roleIds?.length ? data.roleIds : ['STORE_MANAGER'],
      permissions: ['*'],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDB(db);
    MockService.addAuditLog('CREATE', 'USER', newUser.id, `Created admin user '${newUser.fullName}' (${newUser.email})`);
    return newUser;
  }

  static async updateUser(id: string, data: any): Promise<User> {
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      db.users[idx] = {
        ...db.users[idx],
        ...data,
        roles: data.roleIds ? data.roleIds : (data.roles || db.users[idx].roles),
      };
      saveDB(db);
      MockService.addAuditLog('UPDATE', 'USER', id, `Updated user '${db.users[idx].fullName}'`);
      return db.users[idx];
    }
    throw new Error('User not found');
  }

  static async deleteUser(id: string) {
    const db = loadDB();
    if (db.users.length <= 1) {
      throw new Error('لا يمكن حذف المستخدم الرئيسي الوحيد في النظام');
    }
    const u = db.users.find((user) => user.id === id);
    db.users = db.users.filter((user) => user.id !== id);
    saveDB(db);
    MockService.addAuditLog('DELETE', 'USER', id, `Deleted user '${u?.fullName || id}'`);
    return { message: 'User deleted successfully' };
  }

  static async getRoles() {
    return [
      { id: 'r-1', name: 'SUPER_ADMIN', displayNameAr: 'مدير عام (Super Admin)', displayNameEn: 'Super Admin' },
      { id: 'r-2', name: 'STORE_MANAGER', displayNameAr: 'مدير متجر (Store Manager)', displayNameEn: 'Store Manager' },
      { id: 'r-3', name: 'ORDER_FULFILLER', displayNameAr: 'مسؤول الطلبات والمبيعات', displayNameEn: 'Order Fulfiller' },
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
      totalRevenue: totalRevenue,
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

  // --- Media ---
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
    MockService.addAuditLog('CREATE', 'MEDIA', item.id, `Uploaded media: ${item.url}`);
    return item;
  }

  static async deleteMedia(id: string) {
    const db = loadDB();
    db.media = db.media.filter((m) => m.id !== id);
    saveDB(db);
    MockService.addAuditLog('DELETE', 'MEDIA', id, `Deleted media item #${id}`);
    return { message: 'Deleted' };
  }

  // --- Audit Logs ---
  static async getAuditLogs(params?: any): Promise<PaginatedResult<AuditLog>> {
    const db = loadDB();
    let filtered = [...db.auditLogs];

    if (params?.entity) {
      filtered = filtered.filter((l) => l.entity.toLowerCase() === params.entity.toLowerCase());
    }
    if (params?.action) {
      filtered = filtered.filter((l) => l.action.toLowerCase() === params.action.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (l) =>
          l.entity.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q)) ||
          (l.user?.fullName && l.user.fullName.toLowerCase().includes(q)) ||
          (l.ipAddress && l.ipAddress.includes(q)),
      );
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
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

  static async clearAuditLogs() {
    const db = loadDB();
    db.auditLogs = [];
    saveDB(db);
    return { message: 'تم مسح سجل العمليات بنجاح' };
  }

  // --- Analytics & Visitor Tracking ---
  static async recordVisitorHit(data: {
    sessionId: string;
    visitorId: string;
    ipAddress: string;
    deviceType: string;
    browser: string;
    os: string;
    screenResolution?: string;
    referrer: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    currentPath: string;
  }) {
    const db = loadDB();
    const now = new Date().toISOString();
    const existingIdx = db.visitorSessions.findIndex((s) => s.id === data.sessionId);

    if (existingIdx !== -1) {
      const session = db.visitorSessions[existingIdx];
      if (!session.pagesVisited.includes(data.currentPath)) {
        session.pagesVisited.push(data.currentPath);
      }
      session.totalPageViews += 1;
      session.lastSeenAt = now;
      session.durationSeconds = Math.max(
        5,
        Math.round((new Date(now).getTime() - new Date(session.firstSeenAt).getTime()) / 1000),
      );
      db.visitorSessions[existingIdx] = session;
    } else {
      const newSession: VisitorSession = {
        id: data.sessionId,
        visitorId: data.visitorId,
        ipAddress: data.ipAddress || '127.0.0.1',
        country: 'مصر (EG)',
        city: 'القاهرة / الجيزة',
        deviceType: (data.deviceType as any) || 'mobile',
        browser: data.browser || 'Chrome',
        os: data.os || 'Android',
        screenResolution: data.screenResolution,
        referrer: data.referrer || 'Direct / مباشر',
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent,
        utmTerm: data.utmTerm,
        pagesVisited: [data.currentPath || '/'],
        totalPageViews: 1,
        durationSeconds: 10,
        hasOrder: false,
        firstSeenAt: now,
        lastSeenAt: now,
      };
      db.visitorSessions.unshift(newSession);
      if (db.visitorSessions.length > 500) {
        db.visitorSessions = db.visitorSessions.slice(0, 500);
      }
    }

    saveDB(db);
    return { success: true };
  }

  static async recordAnalyticsEvent(data: {
    sessionId: string;
    visitorId: string;
    ipAddress: string;
    eventType: string;
    path: string;
    payload?: Record<string, unknown>;
  }) {
    const db = loadDB();
    const now = new Date().toISOString();

    const newEvent: AnalyticsEvent = {
      id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      ipAddress: data.ipAddress || '127.0.0.1',
      eventType: data.eventType as any,
      path: data.path,
      payload: data.payload,
      createdAt: now,
    };

    db.analyticsEvents.unshift(newEvent);
    if (db.analyticsEvents.length > 1000) {
      db.analyticsEvents = db.analyticsEvents.slice(0, 1000);
    }

    // If purchase event, update session
    if (data.eventType === 'purchase' && data.payload?.orderNumber) {
      const sIdx = db.visitorSessions.findIndex((s) => s.id === data.sessionId);
      if (sIdx !== -1) {
        db.visitorSessions[sIdx].hasOrder = true;
        db.visitorSessions[sIdx].orderNumber = String(data.payload.orderNumber);
      }
    }

    saveDB(db);
    return { success: true };
  }

  static async recordAbandonedCart(data: {
    sessionId: string;
    visitorId: string;
    ipAddress: string;
    deviceType: string;
    items: CartItem[];
    itemsCount: number;
    totalValue: number;
  }) {
    const db = loadDB();
    const now = new Date().toISOString();

    const existingIdx = db.abandonedCarts.findIndex((c) => c.sessionId === data.sessionId);
    if (existingIdx !== -1) {
      db.abandonedCarts[existingIdx] = {
        ...db.abandonedCarts[existingIdx],
        items: data.items,
        itemsCount: data.itemsCount,
        totalValue: data.totalValue,
        lastActiveAt: now,
      };
    } else {
      const newAbandoned: AbandonedCart = {
        id: 'abn-' + Date.now(),
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        ipAddress: data.ipAddress || '127.0.0.1',
        deviceType: data.deviceType || 'mobile',
        items: data.items,
        itemsCount: data.itemsCount,
        totalValue: data.totalValue,
        currency: db.settings.currency || 'EGP',
        createdAt: now,
        lastActiveAt: now,
        isRecovered: false,
      };
      db.abandonedCarts.unshift(newAbandoned);
      if (db.abandonedCarts.length > 200) {
        db.abandonedCarts = db.abandonedCarts.slice(0, 200);
      }
    }

    saveDB(db);
    return { success: true };
  }

  static async getAnalyticsSummary(_timeRange?: string): Promise<AnalyticsSummary> {
    const db = loadDB();
    const sessions = db.visitorSessions;
    const events = db.analyticsEvents;

    const totalVisitors = sessions.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const uniqueVisitorsToday = new Set(
      sessions.filter((s) => s.firstSeenAt.startsWith(todayStr)).map((s) => s.visitorId || s.ipAddress),
    ).size;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const uniqueVisitorsThisWeek = new Set(
      sessions.filter((s) => s.firstSeenAt >= sevenDaysAgo).map((s) => s.visitorId || s.ipAddress),
    ).size;

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const liveVisitorsNow = sessions.filter((s) => s.lastSeenAt >= fiveMinsAgo).length;

    const totalPageViews = sessions.reduce((acc, s) => acc + (s.totalPageViews || 1), 0);
    const singlePageSessions = sessions.filter((s) => (s.pagesVisited?.length || 1) <= 1).length;
    const bounceRate = totalVisitors > 0 ? Math.round((singlePageSessions / totalVisitors) * 100) : 0;

    const totalDuration = sessions.reduce((acc, s) => acc + (s.durationSeconds || 10), 0);
    const avgSessionDurationSeconds = totalVisitors > 0 ? Math.round(totalDuration / totalVisitors) : 0;

    // Abandoned carts
    const pendingAbandoned = db.abandonedCarts.filter((c) => !c.isRecovered);
    const abandonedCartsCount = pendingAbandoned.length;
    const abandonedCartsValue = pendingAbandoned.reduce((sum, c) => sum + (c.totalValue || 0), 0);

    // Top Visited Pages
    const pageCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      s.pagesVisited.forEach((p) => {
        pageCounts[p] = (pageCounts[p] || 0) + 1;
      });
    });
    const topVisitedPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Top Viewed Products
    const productViews: Record<string, { nameAr: string; views: number; addToCartCount: number }> = {};
    events.forEach((ev) => {
      if (ev.eventType === 'view_product' && ev.payload?.productId) {
        const pid = String(ev.payload.productId);
        if (!productViews[pid]) {
          productViews[pid] = { nameAr: String(ev.payload.productNameAr || 'منتج'), views: 0, addToCartCount: 0 };
        }
        productViews[pid].views += 1;
      }
      if (ev.eventType === 'add_to_cart' && ev.payload?.productId) {
        const pid = String(ev.payload.productId);
        if (!productViews[pid]) {
          productViews[pid] = { nameAr: String(ev.payload.productName || 'منتج'), views: 0, addToCartCount: 0 };
        }
        productViews[pid].addToCartCount += 1;
      }
    });

    const topViewedProducts = Object.entries(productViews)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    // Traffic Sources
    const sourceCounts: Record<string, { visitors: number; ordersCount: number }> = {};
    sessions.forEach((s) => {
      const src = s.referrer || 'Direct / مباشر';
      if (!sourceCounts[src]) sourceCounts[src] = { visitors: 0, ordersCount: 0 };
      sourceCounts[src].visitors += 1;
      if (s.hasOrder) sourceCounts[src].ordersCount += 1;
    });

    const trafficSources = Object.entries(sourceCounts).map(([source, data]) => ({
      source,
      visitors: data.visitors,
      ordersCount: data.ordersCount,
      percentage: totalVisitors > 0 ? Math.round((data.visitors / totalVisitors) * 100) : 0,
    })).sort((a, b) => b.visitors - a.visitors);

    // Campaigns (UTM)
    const campaignCounts: Record<string, { source: string; visitors: number; ordersCount: number; revenue: number }> = {};
    sessions.forEach((s) => {
      if (s.utmCampaign) {
        const cKey = s.utmCampaign;
        if (!campaignCounts[cKey]) {
          campaignCounts[cKey] = { source: s.utmSource || 'Campaign', visitors: 0, ordersCount: 0, revenue: 0 };
        }
        campaignCounts[cKey].visitors += 1;
        if (s.hasOrder) {
          campaignCounts[cKey].ordersCount += 1;
          const matchedOrder = db.orders.find((o) => o.orderNumber === s.orderNumber);
          if (matchedOrder) campaignCounts[cKey].revenue += Number(matchedOrder.totalAmount);
        }
      }
    });

    const campaigns = Object.entries(campaignCounts).map(([campaign, data]) => ({
      campaign,
      ...data,
    })).sort((a, b) => b.visitors - a.visitors);

    // Devices, OS, Browsers Breakdown
    const devMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};
    const broMap: Record<string, number> = {};

    sessions.forEach((s) => {
      devMap[s.deviceType] = (devMap[s.deviceType] || 0) + 1;
      osMap[s.os] = (osMap[s.os] || 0) + 1;
      broMap[s.browser] = (broMap[s.browser] || 0) + 1;
    });

    const deviceBreakdown = Object.entries(devMap).map(([device, count]) => ({
      device,
      count,
      percentage: totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0,
    }));

    const osBreakdown = Object.entries(osMap).map(([os, count]) => ({
      os,
      count,
      percentage: totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0,
    }));

    const browserBreakdown = Object.entries(broMap).map(([browser, count]) => ({
      browser,
      count,
      percentage: totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0,
    }));

    return {
      totalVisitors,
      uniqueVisitorsToday,
      uniqueVisitorsThisWeek,
      liveVisitorsNow,
      totalPageViews,
      bounceRate,
      avgSessionDurationSeconds,
      abandonedCartsCount,
      abandonedCartsValue,
      topVisitedPages,
      topViewedProducts,
      trafficSources,
      campaigns,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
    };
  }

  static async getVisitorSessions(params?: any): Promise<PaginatedResult<VisitorSession>> {
    const db = loadDB();
    let filtered = [...db.visitorSessions];

    if (params?.source) {
      filtered = filtered.filter((s) => s.referrer.toLowerCase().includes(params.source.toLowerCase()));
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.ipAddress.includes(q) ||
          s.browser.toLowerCase().includes(q) ||
          s.os.toLowerCase().includes(q) ||
          s.referrer.toLowerCase().includes(q) ||
          (s.utmCampaign && s.utmCampaign.toLowerCase().includes(q)),
      );
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
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

  static async getAnalyticsEvents(params?: any): Promise<PaginatedResult<AnalyticsEvent>> {
    const db = loadDB();
    let filtered = [...db.analyticsEvents];

    if (params?.eventType) {
      filtered = filtered.filter((e) => e.eventType === params.eventType);
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 25;
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

  static async getAbandonedCarts(params?: any): Promise<PaginatedResult<AbandonedCart>> {
    const db = loadDB();
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const total = db.abandonedCarts.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const items = db.abandonedCarts.slice((page - 1) * limit, page * limit);

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

  static async clearAnalyticsLogs() {
    const db = loadDB();
    db.visitorSessions = [];
    db.analyticsEvents = [];
    db.abandonedCarts = [];
    saveDB(db);
    return { message: 'تم مسح سجلات وبيانات الزوار بنجاح' };
  }

  // --- Backup & Restore ---
  static async exportBackup() {
    const db = loadDB();
    MockService.addAuditLog('EXPORT_BACKUP', 'SYSTEM', 'backup', 'Exported complete store database backup');
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
      visitorSessions: Array.isArray(importedData.visitorSessions) ? importedData.visitorSessions : [],
      analyticsEvents: Array.isArray(importedData.analyticsEvents) ? importedData.analyticsEvents : [],
      abandonedCarts: Array.isArray(importedData.abandonedCarts) ? importedData.abandonedCarts : [],
    };

    saveDB(newDb);
    MockService.addAuditLog('RESTORE_BACKUP', 'SYSTEM', 'backup', 'Restored store from backup file');
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
      visitorSessions: [],
      analyticsEvents: [],
      abandonedCarts: [],
    };
    saveDB(initial);
    MockService.addAuditLog('RESET_DEFAULTS', 'SYSTEM', 'reset', 'Reset store to initial factory defaults');
    return { success: true, message: 'Database reset to factory defaults' };
  }
}

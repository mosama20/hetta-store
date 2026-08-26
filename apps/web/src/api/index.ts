import { apiClient } from './client.js';
import {
  Product,
  ProductVariant,
  Category,
  Color,
  Size,
  Order,
  OrderStatus,
  CMSSection,
  Discount,
  StoreSettings,
  DashboardStats,
  PaginatedResult,
  User,
  CartItem,
  AuditLog,
  VisitorSession,
  AnalyticsEvent,
  AbandonedCart,
  AnalyticsSummary,
} from '../types/index.js';

export * from './client.js';

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: (refreshToken: string) =>
    apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  getMe: () => apiClient<User>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    apiClient<{ success: boolean; message: string; resetCode?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { email: string; resetCode: string; newPassword: string }) =>
    apiClient<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Products API
export const productsApi = {
  getAll: (params?: {
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
  }) => apiClient<PaginatedResult<Product>>('/products', { params }),
  getBySlug: (slug: string) => apiClient<Product>(`/products/${slug}`),
  getById: (id: string) => apiClient<Product>(`/products/${id}`),
  create: (data: unknown) =>
    apiClient<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiClient<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  bulkImport: (items: unknown[]) =>
    apiClient<{ success: boolean; importedCount: number; errors?: string[] }>('/products/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  adjustStock: (variantId: string, quantityChange: number) =>
    apiClient<ProductVariant>(`/products/variants/${variantId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityChange }),
    }),
};

// Categories API
export const categoriesApi = {
  getAll: (all = false) =>
    apiClient<Category[]>('/categories', { params: { all: all ? 'true' : undefined } }),
  getTree: () => apiClient<Category[]>('/categories/tree'),
  getBySlug: (slug: string) => apiClient<Category>(`/categories/${slug}`),
  create: (data: unknown) =>
    apiClient<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiClient<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  reorder: (items: { id: string; displayOrder: number }[]) =>
    apiClient<Category[]>('/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Attributes API
export const attributesApi = {
  getColors: () => apiClient<Color[]>('/attributes/colors'),
  createColor: (data: { nameAr: string; nameEn: string; hexCode: string; displayOrder?: number }) =>
    apiClient<Color>('/attributes/colors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateColor: (id: string, data: Partial<Color>) =>
    apiClient<Color>(`/attributes/colors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSizes: () => apiClient<Size[]>('/attributes/sizes'),
  createSize: (data: { nameAr: string; nameEn: string; displayOrder?: number }) =>
    apiClient<Size>('/attributes/sizes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSize: (id: string, data: Partial<Size>) =>
    apiClient<Size>(`/attributes/sizes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Orders API
export const ordersApi = {
  create: (data: {
    customerName: string;
    customerPhone: string;
    customerCity?: string;
    customerAddress?: string;
    notes?: string;
    items: { variantId: string; quantity: number }[];
  }) =>
    apiClient<{ order: Order; whatsappUrl: string; whatsappMessage: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAll: (params?: { page?: number; limit?: number; status?: OrderStatus; search?: string }) =>
    apiClient<PaginatedResult<Order>>('/orders', { params }),
  getById: (id: string) => apiClient<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus) =>
    apiClient<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    }),
};

// CMS API
export const cmsApi = {
  getActiveSections: () => apiClient<CMSSection[]>('/cms/sections'),
  getAllSections: () => apiClient<CMSSection[]>('/cms/admin/sections'),
  updateSection: (key: string, data: unknown) =>
    apiClient<CMSSection>(`/cms/sections/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Settings API
export const settingsApi = {
  getPublic: () => apiClient<StoreSettings>('/settings/public'),
  getAll: () => apiClient<{ id: string; key: string; value: string; group: string }[]>('/settings'),
  update: (key: string, value: string, group?: string) =>
    apiClient<unknown>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, group }),
    }),
  exportBackup: () => apiClient<any>('/settings/backup/export'),
  importBackup: (data: any) =>
    apiClient<{ success: boolean; message: string; stats?: any }>('/settings/backup/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetBackup: () =>
    apiClient<{ success: boolean; message: string }>('/settings/backup/reset', {
      method: 'POST',
    }),
};

// Discounts API
export const discountsApi = {
  getAll: (all = false) =>
    apiClient<Discount[]>('/discounts', { params: { all: all ? 'true' : undefined } }),
  create: (data: unknown) =>
    apiClient<Discount>('/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/discounts/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => apiClient<PaginatedResult<User>>('/users', { params }),
  getRoles: () =>
    apiClient<{ id: string; name: string; displayNameAr: string; displayNameEn: string }[]>(
      '/users/roles',
    ),
  getById: (id: string) => apiClient<User>(`/users/${id}`),
  create: (data: unknown) =>
    apiClient<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiClient<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Media API
export const mediaApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient<PaginatedResult<{ id: string; url: string; mimeType: string }>>('/media', { params }),
  register: (data: {
    url: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
  }) =>
    apiClient<{ id: string; url: string }>('/media/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/media/${id}`, {
      method: 'DELETE',
    }),
};

// Dashboard API
// Dashboard API
export const dashboardApi = {
  getStats: () => apiClient<DashboardStats>('/dashboard/stats'),
};

// Audit API
export const auditApi = {
  getAll: (params?: { page?: number; limit?: number; entity?: string; action?: string; search?: string }) =>
    apiClient<PaginatedResult<AuditLog>>('/audit', { params }),
  clearAll: () =>
    apiClient<{ message: string }>('/audit', {
      method: 'DELETE',
    }),
};

// Analytics & Visitor Tracking API
export const analyticsApi = {
  recordHit: (data: {
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
  }) =>
    apiClient<{ success: boolean }>('/analytics/hit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordEvent: (data: {
    sessionId: string;
    visitorId: string;
    ipAddress: string;
    eventType: string;
    path: string;
    payload?: Record<string, unknown>;
  }) =>
    apiClient<{ success: boolean }>('/analytics/event', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordAbandonedCart: (data: {
    sessionId: string;
    visitorId: string;
    ipAddress: string;
    deviceType: string;
    items: CartItem[];
    itemsCount: number;
    totalValue: number;
  }) =>
    apiClient<{ success: boolean }>('/analytics/abandoned-cart', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSummary: (timeRange?: 'today' | 'week' | 'month' | 'all') =>
    apiClient<AnalyticsSummary>('/analytics/summary', { params: { timeRange } }),

  getSessions: (params?: { page?: number; limit?: number; search?: string; source?: string }) =>
    apiClient<PaginatedResult<VisitorSession>>('/analytics/sessions', { params }),

  getEvents: (params?: { page?: number; limit?: number; eventType?: string }) =>
    apiClient<PaginatedResult<AnalyticsEvent>>('/analytics/events', { params }),

  getAbandonedCarts: (params?: { page?: number; limit?: number }) =>
    apiClient<PaginatedResult<AbandonedCart>>('/analytics/abandoned-carts', { params }),

  clearLogs: () =>
    apiClient<{ message: string }>('/analytics/clear', {
      method: 'DELETE',
    }),
};


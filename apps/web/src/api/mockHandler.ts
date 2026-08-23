import { MockService } from './mockService.js';
import { RequestOptions } from './client.js';

export async function handleMockRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
  const params = options.params || {};

  // Artificial short delay for realistic snappy feel
  await new Promise((resolve) => setTimeout(resolve, 50));

  // --- Auth ---
  if (cleanEndpoint === '/auth/login' && method === 'POST') {
    return (await MockService.login(body)) as unknown as T;
  }
  if (cleanEndpoint === '/auth/me') {
    return (await MockService.getMe()) as unknown as T;
  }
  if (cleanEndpoint === '/auth/logout') {
    return { message: 'Logged out' } as unknown as T;
  }
  if (cleanEndpoint === '/auth/change-password') {
    return { message: 'Password changed successfully' } as unknown as T;
  }

  // --- Dashboard Stats ---
  if (cleanEndpoint === '/dashboard/stats') {
    return (await MockService.getDashboardStats()) as unknown as T;
  }

  // --- Products ---
  if (cleanEndpoint === '/products') {
    if (method === 'POST') {
      return (await MockService.createProduct(body)) as unknown as T;
    }
    return (await MockService.getProducts(params as any)) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/products/variants/') && cleanEndpoint.endsWith('/stock')) {
    const parts = cleanEndpoint.split('/');
    const variantId = parts[3];
    return (await MockService.adjustStock(variantId, body.quantityChange || 0)) as unknown as T;
  }
  if (cleanEndpoint === '/products/bulk-import') {
    return (await MockService.bulkImport(body.items || [])) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/products/')) {
    const idOrSlug = cleanEndpoint.replace('/products/', '');
    if (method === 'PUT') {
      return (await MockService.updateProduct(idOrSlug, body)) as unknown as T;
    }
    if (method === 'DELETE') {
      return (await MockService.deleteProduct(idOrSlug)) as unknown as T;
    }
    // GET by id or slug
    if (idOrSlug.startsWith('prod-')) {
      return (await MockService.getProductById(idOrSlug)) as unknown as T;
    }
    return (await MockService.getProductBySlug(idOrSlug)) as unknown as T;
  }

  // --- Categories ---
  if (cleanEndpoint === '/categories' || cleanEndpoint === '/categories/tree') {
    if (method === 'POST') {
      return (await MockService.createCategory(body)) as unknown as T;
    }
    return (await MockService.getCategories(params.all === 'true' || params.all === true)) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/categories/')) {
    const idOrSlug = cleanEndpoint.replace('/categories/', '');
    if (method === 'PUT') {
      return (await MockService.updateCategory(idOrSlug, body)) as unknown as T;
    }
    if (method === 'DELETE') {
      return (await MockService.deleteCategory(idOrSlug)) as unknown as T;
    }
    return (await MockService.getCategoryBySlug(idOrSlug)) as unknown as T;
  }

  // --- Attributes ---
  if (cleanEndpoint === '/attributes/colors') {
    if (method === 'POST') {
      return (await MockService.createColor(body)) as unknown as T;
    }
    return (await MockService.getColors()) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/attributes/colors/')) {
    const id = cleanEndpoint.replace('/attributes/colors/', '');
    return (await MockService.updateColor(id, body)) as unknown as T;
  }
  if (cleanEndpoint === '/attributes/sizes') {
    if (method === 'POST') {
      return (await MockService.createSize(body)) as unknown as T;
    }
    return (await MockService.getSizes()) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/attributes/sizes/')) {
    const id = cleanEndpoint.replace('/attributes/sizes/', '');
    return (await MockService.updateSize(id, body)) as unknown as T;
  }

  // --- Orders ---
  if (cleanEndpoint === '/orders') {
    if (method === 'POST') {
      return (await MockService.createOrder(body)) as unknown as T;
    }
    return (await MockService.getOrders(params as any)) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/orders/') && cleanEndpoint.endsWith('/status')) {
    const id = cleanEndpoint.split('/')[2];
    return (await MockService.updateOrderStatus(id, body.status)) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/orders/')) {
    const id = cleanEndpoint.replace('/orders/', '');
    if (method === 'DELETE') {
      return (await MockService.deleteOrder(id)) as unknown as T;
    }
    return (await MockService.getOrderById(id)) as unknown as T;
  }

  // --- Settings & Backup ---
  if (cleanEndpoint === '/settings/backup/export') {
    return (await MockService.exportBackup()) as unknown as T;
  }
  if (cleanEndpoint === '/settings/backup/import' && method === 'POST') {
    return (await MockService.importBackup(body)) as unknown as T;
  }
  if (cleanEndpoint === '/settings/backup/reset' && method === 'POST') {
    return (await MockService.resetToDefaults()) as unknown as T;
  }
  if (cleanEndpoint === '/settings/public') {
    return (await MockService.getPublicSettings()) as unknown as T;
  }
  if (cleanEndpoint === '/settings') {
    return (await MockService.getAllSettings()) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/settings/')) {
    const key = cleanEndpoint.replace('/settings/', '');
    return (await MockService.updateSetting(key, body.value)) as unknown as T;
  }

  // --- CMS ---
  if (cleanEndpoint === '/cms/sections' || cleanEndpoint === '/cms/admin/sections') {
    return (await MockService.getCmsSections()) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/cms/sections/')) {
    const key = cleanEndpoint.replace('/cms/sections/', '');
    return (await MockService.updateCmsSection(key, body)) as unknown as T;
  }

  // --- Discounts ---
  if (cleanEndpoint === '/discounts') {
    if (method === 'POST') {
      return (await MockService.createDiscount(body)) as unknown as T;
    }
    return (await MockService.getDiscounts(params.all === 'true' || params.all === true)) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/discounts/')) {
    const id = cleanEndpoint.replace('/discounts/', '');
    return (await MockService.deleteDiscount(id)) as unknown as T;
  }

  // --- Users ---
  if (cleanEndpoint === '/users') {
    if (method === 'POST') {
      return (await MockService.createUser(body)) as unknown as T;
    }
    return (await MockService.getUsers(params)) as unknown as T;
  }
  if (cleanEndpoint === '/users/roles') {
    return (await MockService.getRoles()) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/users/')) {
    const id = cleanEndpoint.replace('/users/', '');
    if (method === 'PUT') {
      return (await MockService.updateUser(id, body)) as unknown as T;
    }
    if (method === 'DELETE') {
      return (await MockService.deleteUser(id)) as unknown as T;
    }
  }

  // --- Media ---
  if (cleanEndpoint === '/media') {
    return (await MockService.getMedia(params)) as unknown as T;
  }
  if (cleanEndpoint === '/media/register') {
    return (await MockService.registerMedia(body)) as unknown as T;
  }
  if (cleanEndpoint.startsWith('/media/')) {
    const id = cleanEndpoint.replace('/media/', '');
    return (await MockService.deleteMedia(id)) as unknown as T;
  }

  // --- Audit ---
  if (cleanEndpoint === '/audit') {
    return (await MockService.getAuditLogs(params)) as unknown as T;
  }

  throw new Error(`Unhandled mock route: ${cleanEndpoint}`);
}

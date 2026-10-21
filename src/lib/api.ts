import type { Product, Order, User, Review, ReviewStatus, ApiResponse, Category, NavigationItem } from '@/types';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('luxe_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (res.status === 401 && endpoint !== '/api/auth/login' && typeof window !== 'undefined') {
      // Token is invalid/expired (e.g. backend restarted): force a fresh login
      localStorage.removeItem('luxe_admin_token');
      localStorage.removeItem('luxe_admin_user');
      document.cookie = 'luxe_token=; path=/; max-age=0';
      window.location.href = '/login';
    }
    if (!res.ok) {
      const errorText =
        typeof data?.error === 'string'
          ? data.error
          : typeof data?.message === 'string'
          ? data.message
          : `Request failed with status ${res.status}`;
      return {
        success: false,
        error: errorText,
        ...(typeof data === 'object' && data !== null ? data : {}),
      };
    }
    return data;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error or backend unreachable',
    };
  }
}

/**
 * Membersihkan payload produk sebelum dikirim ke backend:
 * Menghapus field turunan:
 * - stock di level produk
 * - stock di level warna (colorVariants[].stock)
 * Memastikan hanya sizeStock dan field yang memang diedit yang terkirim.
 */
export function sanitizeProductPayload<T extends Partial<Product>>(data: T): Partial<Product> {
  if (!data || typeof data !== 'object') return data;
  const { stock: _rootStock, ...rest } = data;

  const sanitized: Partial<Product> = { ...rest };

  if (Array.isArray(sanitized.colorVariants)) {
    sanitized.colorVariants = sanitized.colorVariants.map((variant) => {
      if (!variant || typeof variant !== 'object') return variant;
      const { stock: _variantStock, ...cleanVariant } = variant;
      return cleanVariant;
    });
  }

  return sanitized;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      request('/api/auth/logout', {
        method: 'POST',
      }),
    me: () =>
      request<{ user: User }>('/api/auth/me'),
  },

  // Products
  products: {
    list: (params?: {
      category?: string;
      search?: string;
      sort?: string;
      featured?: boolean;
      gender?: string;
      collection?: boolean;
    }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      if (params?.sort) q.append('sort', params.sort);
      if (params?.featured !== undefined) q.append('featured', String(params.featured));
      if (params?.gender) q.append('gender', params.gender);
      if (params?.collection !== undefined) q.append('collection', String(params.collection));
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<{ products: Product[]; total: number }>(`/api/products${qs}`);
    },
    get: (id: string) =>
      request<Product>(`/api/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(sanitizeProductPayload(data)),
      }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sanitizeProductPayload(data)),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
      }),
    getMenus: (id: string) =>
      request<{
        productId: string;
        menuIds: string[];
        menus: { id: string; label: string; slug: string; order: number }[];
      }>(`/api/products/${id}/menus`),
    updateMenus: (id: string, menuIds: string[]) =>
      request<{
        productId: string;
        menuIds: string[];
        menus: { id: string; label: string; slug: string; order: number }[];
      }>(`/api/products/${id}/menus`, {
        method: 'PUT',
        body: JSON.stringify({ menuIds }),
      }),
  },

  // Categories
  categories: {
    list: (params?: { all?: boolean }) => {
      const qs = params?.all ? '?all=true' : '';
      return request<Category[]>(`/api/categories${qs}`);
    },
    create: (data: {
      name: string;
      slug?: string;
      active?: boolean;
      order?: number;
      label_en?: string;
      label_id?: string;
    }) =>
      request<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string, moveTo?: string) => {
      const qs = moveTo ? `?moveTo=${encodeURIComponent(moveTo)}` : '';
      return request<{ deleted: boolean; movedProductCount?: number; targetCategoryId?: string }>(
        `/api/categories/${id}${qs}`,
        { method: 'DELETE' }
      );
    },
    reorder: (ids: string[]) =>
      request<Category[]>('/api/categories/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
      }),
  },

  // Navigation
  navigation: {
    list: (params?: { public?: boolean }) => {
      const qs = params?.public ? '?public=1' : '';
      return request<NavigationItem[]>(`/api/navigation${qs}`);
    },
    getProducts: (id: string) =>
      request<{
        navigation: { id: string; label: string; slug: string; productCount: number };
        products: Product[];
        total: number;
      }>(`/api/navigation/${id}/products`),
    updateProducts: (id: string, productIds: string[]) =>
      request<NavigationItem>(`/api/navigation/${id}/products`, {
        method: 'PUT',
        body: JSON.stringify({ productIds }),
      }),
    create: (data: {
      label: string;
      type?: string;
      target?: string;
      accent?: boolean;
      active?: boolean;
      order?: number;
      childCategoryIds?: string[];
      gender?: 'women' | 'men' | 'unisex';
      label_en?: string;
      label_id?: string;
      productIds?: string[];
    }) =>
      request<NavigationItem>('/api/navigation', {
        method: 'POST',
        body: JSON.stringify({
          type: 'category',
          ...data,
        }),
      }),
    update: (id: string, data: Partial<NavigationItem>) =>
      request<NavigationItem>(`/api/navigation/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/navigation/${id}`, {
        method: 'DELETE',
      }),
    reorder: (ids: string[]) =>
      request<NavigationItem[]>('/api/navigation/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
      }),
  },

  // Orders
  orders: {
    list: () =>
      request<{ orders: Order[]; total: number }>('/api/orders'),
    get: (id: string) =>
      request<Order>(`/api/orders/${id}`),
    updateStatus: (id: string, update: Partial<Order>) =>
      request<Order>(`/api/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(update),
      }),
  },

  // Reviews
  reviews: {
    list: () => request<Review[]>('/api/reviews'),
    updateStatus: (id: string, status: ReviewStatus) =>
      request<Review>(`/api/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/reviews/${id}`, {
        method: 'DELETE',
      }),
  },

  // Users
  users: {
    list: () =>
      request<{ users: User[]; total: number }>('/api/users'),
  },

  // Upload
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

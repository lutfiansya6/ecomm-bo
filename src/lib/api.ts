import type { Product, Order, User, ApiResponse } from '@/types';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('luxe_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || data.message || `Request failed with status ${res.status}`,
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
    list: (params?: { category?: string; search?: string; sort?: string; featured?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      if (params?.sort) q.append('sort', params.sort);
      if (params?.featured !== undefined) q.append('featured', String(params.featured));
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<{ products: Product[]; total: number }>(`/api/products${qs}`);
    },
    get: (id: string) =>
      request<Product>(`/api/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
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

  // Users
  users: {
    list: () =>
      request<{ users: User[]; total: number }>('/api/users'),
  },
};

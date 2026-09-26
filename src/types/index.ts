// ============================================================
// LUXE Backoffice — TypeScript Type Definitions
// ============================================================

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
}

export type ProductCategory =
  | 'dress'
  | 'blazer'
  | 'bag'
  | 'shoes'
  | 'coat'
  | 'accessories';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: ProductCategory;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
  price?: number;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = 'credit_card' | 'gopay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  address: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  totalCustomers: number;
  avgOrderValue: number;
}

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  label_en?: string;
  label_id?: string;
  createdAt: string;
  productCount?: number;
}

export type ProductCategory = string;

export type NavigationItemType = 'all' | 'new' | 'sale' | 'category' | 'url';

export interface NavigationChildCategory {
  id?: string;
  name: string;
  slug: string;
  label_en?: string;
  label_id?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  type: NavigationItemType;
  target: string;
  accent: boolean;
  order: number;
  active: boolean;
  system: boolean;
  childCategoryIds?: string[];
  children?: NavigationChildCategory[];
  gender?: 'women' | 'men' | 'unisex';
  label_en?: string;
  label_id?: string;
  productIds?: string[];
  productCount?: number;
  slug?: string;
  createdAt: string;
}

export type ProductGender = 'women' | 'men' | 'unisex';

export interface ColorVariant {
  name: string;
  hex: string;
  images: string[];
  price?: number;
  stock?: number;
  sizeStock?: Record<string, number>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  categoryId?: string;
  category: ProductCategory;
  gender?: ProductGender;
  collection?: boolean;
  menuIds?: string[];
  images: string[];
  sizes: string[];
  colors: string[];
  colorVariants?: ColorVariant[];
  stock: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
}

export type ReviewStatus = 'published' | 'hidden';

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
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
  productCount?: number;
  [key: string]: unknown;
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

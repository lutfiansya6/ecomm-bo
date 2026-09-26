import clsx, { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string): string {
  if (!name) return 'LX';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', variant: 'success' as const };
    case 'shipped':
      return { label: 'Shipped', variant: 'info' as const };
    case 'confirmed':
      return { label: 'Confirmed', variant: 'gold' as const };
    case 'pending':
      return { label: 'Pending', variant: 'warning' as const };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'error' as const };
    default:
      return { label: status, variant: 'neutral' as const };
  }
}

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', variant: 'success' as const };
    case 'pending':
      return { label: 'Unpaid', variant: 'warning' as const };
    case 'failed':
      return { label: 'Failed', variant: 'error' as const };
    default:
      return { label: status, variant: 'neutral' as const };
  }
}

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'gold' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variantClasses = {
    gold: 'badge-gold',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'badge-neutral',
  }[variant];

  return <span className={cn('badge', variantClasses, className)}>{children}</span>;
}

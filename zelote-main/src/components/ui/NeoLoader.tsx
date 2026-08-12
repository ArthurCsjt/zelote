import React from 'react';
import { cn } from '@/lib/utils';

interface NeoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NeoLoader({ size = 'md', className }: NeoLoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-[6px]',
  };

  return (
    <div
      className={cn(
        "border-black dark:border-white",
        "border-t-transparent dark:border-t-transparent",
        "animate-neo-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface NeoSkeletonProps {
  className?: string;
}

export function NeoSkeleton({ className }: NeoSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-zinc-800",
        "border-2 border-black/20 dark:border-white/20",
        "animate-neo-shimmer relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
  );
}
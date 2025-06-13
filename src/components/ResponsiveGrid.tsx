
import React from 'react';
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid",
    // Responsive columns
    `grid-cols-${cols.default || 1}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    // Responsive gap
    `gap-${gap}`,
    // Ensure full width
    "w-full",
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}


import React from 'react';
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  hasBottomNav?: boolean;
  hasTopNav?: boolean;
  className?: string;
}

export function MobileLayout({ 
  children, 
  hasBottomNav = false,
  hasTopNav = true,
  className 
}: MobileLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      // Responsive padding
      "p-2 sm:p-4 md:p-6 lg:p-8",
      // Account for fixed navigation
      hasTopNav && "pt-16 sm:pt-4",
      hasBottomNav && "pb-20 sm:pb-4",
      // Ensure proper spacing on larger screens
      "max-w-7xl mx-auto",
      className
    )}>
      <div className={cn(
        "space-y-4 sm:space-y-6 md:space-y-8",
        // Ensure content doesn't get too wide on large screens
        "max-w-full"
      )}>
        {children}
      </div>
    </div>
  );
}

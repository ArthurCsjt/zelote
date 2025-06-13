
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

interface MobileOptimizedCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  touchFriendly?: boolean;
}

export function MobileOptimizedCard({ 
  title, 
  children, 
  className, 
  touchFriendly = true 
}: MobileOptimizedCardProps) {
  return (
    <Card className={cn(
      // Base responsive padding
      "p-3 sm:p-4 md:p-6",
      // Touch-friendly spacing
      touchFriendly && "min-h-[44px]",
      // Responsive borders and shadows
      "border border-gray-100 shadow-sm hover:shadow-md",
      "transition-all duration-200",
      // Mobile-first rounded corners
      "rounded-lg sm:rounded-xl",
      className
    )}>
      {title && (
        <CardHeader className="p-0 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

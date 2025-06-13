
import React from 'react';
import { Button, ButtonProps } from "./ui/button";
import { cn } from "@/lib/utils";

interface TouchFriendlyButtonProps extends ButtonProps {
  touchOptimized?: boolean;
}

export function TouchFriendlyButton({ 
  touchOptimized = true,
  className,
  children,
  ...props 
}: TouchFriendlyButtonProps) {
  return (
    <Button
      className={cn(
        // Touch-friendly minimum height (44px iOS guideline)
        touchOptimized && "min-h-[44px] min-w-[44px]",
        // Responsive padding
        "px-4 py-2 sm:px-6 sm:py-3",
        // Responsive text
        "text-sm sm:text-base",
        // Touch-friendly spacing
        "mx-1 my-1",
        // Enhanced tap target
        "relative active:scale-95 transition-transform",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

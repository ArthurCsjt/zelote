
import React from 'react';
import { cn } from "@/lib/utils";

interface ResponsiveTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'button';
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const textVariants = {
  h1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight",
  h2: "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight",
  h3: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-snug",
  h4: "text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-snug",
  body: "text-sm sm:text-base md:text-lg leading-relaxed",
  caption: "text-xs sm:text-sm md:text-base text-gray-600 leading-normal",
  button: "text-sm sm:text-base font-medium leading-none",
};

export function ResponsiveText({ 
  variant = 'body', 
  children, 
  className,
  as 
}: ResponsiveTextProps) {
  const Component = as || (variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p');
  
  return (
    <Component className={cn(
      textVariants[variant],
      // Ensure text doesn't overflow
      "break-words",
      // Mobile-first line height optimization
      "leading-relaxed sm:leading-normal",
      className
    )}>
      {children}
    </Component>
  );
}

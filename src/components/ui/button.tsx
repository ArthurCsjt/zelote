import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-[length:var(--neo-border-width)] border-[hsl(var(--neo-border-color))]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
        destructive:
          "bg-error text-error-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
        outline:
          "bg-background text-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
        ghost: "border-transparent shadow-none hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline border-none shadow-none",
        // New semantic variants
        success: "bg-success text-success-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
        warning: "bg-warning text-warning-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
        info: "bg-info text-info-foreground shadow-[var(--neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--neo-shadow-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--neo-shadow-active)]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
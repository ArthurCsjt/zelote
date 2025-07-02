
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        qrcode: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        camera: "bg-blue-500 text-white hover:bg-blue-600 shadow-md active:shadow-inner active:translate-y-0.5",
        apple: "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 shadow-sm transition-all",
        text: "bg-transparent hover:bg-gray-100 text-gray-800 font-semibold",
        simple: "bg-transparent border-b-2 border-transparent hover:border-current text-current px-1 py-1 rounded-none transition-all",
        gradient: "text-white bg-gradient-to-r shadow-md hover:shadow-lg active:shadow-sm transition-all",
        back: "bg-back-button text-back-button-foreground border border-back-button-border hover:bg-back-button-hover shadow-sm flex items-center justify-center gap-2 font-medium",
        "menu-green": "bg-menu-green text-white hover:bg-menu-green-hover shadow-md transition-all",
        "menu-blue": "bg-menu-blue text-white hover:bg-menu-blue-hover shadow-md transition-all",
        "menu-violet": "bg-menu-violet text-white hover:bg-menu-violet-hover shadow-md transition-all",
        "menu-amber": "bg-menu-amber text-white hover:bg-menu-amber-hover shadow-md transition-all",
        "menu-rose": "bg-menu-rose text-white hover:bg-menu-rose-hover shadow-md transition-all",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-xl",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10 rounded-full",
        mobile: "h-12 px-6 py-3 text-base rounded-xl", // Larger size for mobile touchscreens
        compact: "h-8 px-3 py-1 text-sm",
        minimal: "h-auto px-1 py-0",
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

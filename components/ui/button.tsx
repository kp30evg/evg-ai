import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-evergreen text-white hover:bg-evergreen/90 hover:shadow-lg hover:shadow-evergreen/25",
        glow: "bg-evergreen text-white hover:shadow-[0_0_30px_rgba(29,82,56,0.5)] hover:scale-105 border border-evergreen/20",
        outline: "border-2 border-evergreen/20 bg-transparent hover:bg-evergreen/5 hover:border-evergreen/40",
        ghost: "hover:bg-evergreen/5 hover:text-evergreen",
        gold: "bg-gradient-to-r from-gold to-yellow-400 text-black font-bold hover:shadow-[0_0_30px_rgba(255,214,0,0.5)] hover:scale-105",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        xl: "h-16 rounded-3xl px-10 text-lg",
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
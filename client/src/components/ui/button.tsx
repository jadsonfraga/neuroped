import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.9rem] text-[13px] font-semibold tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-[background-color,border-color,color,box-shadow,transform,filter] duration-200 ease-out",
  {
    variants: {
      variant: {
        default:
          "border border-primary/70 bg-primary text-primary-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.06),0_10px_24px_-18px_hsl(var(--primary)/0.9)] hover:brightness-[1.03] hover:shadow-[0_1px_2px_hsl(var(--foreground)/0.06),0_14px_30px_-20px_hsl(var(--primary)/0.92)] active:scale-[0.992]",
        destructive:
          "border border-destructive/70 bg-destructive text-destructive-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.06),0_10px_24px_-18px_hsl(var(--destructive)/0.65)] hover:brightness-[1.03] active:scale-[0.992]",
        outline:
          "border border-border/90 bg-card/70 text-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.035),inset_0_1px_0_hsl(var(--card-foreground)/0.025)] hover:border-primary/25 hover:bg-muted/55 hover:shadow-[0_8px_20px_-16px_hsl(var(--foreground)/0.34)] active:scale-[0.992]",
        secondary:
          "border border-border/70 bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_hsl(var(--card)/0.55)] hover:bg-secondary/80 active:scale-[0.992]",
        ghost:
          "border border-transparent bg-transparent text-foreground/78 hover:bg-muted/62 hover:text-foreground active:scale-[0.992]",
      },
      size: {
        default: "min-h-10 px-4 py-2.5",
        sm: "min-h-9 rounded-[0.78rem] px-3 text-xs",
        lg: "min-h-11 rounded-[1rem] px-6 text-sm",
        icon: "h-10 w-10 rounded-[0.85rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

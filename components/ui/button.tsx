import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-zinc-50 shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 hover:shadow-zinc-900/30 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/70",
        outline:
          "border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
        secondary:
          "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
        ghost: "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        link: "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50",
        glass: "bg-white/80 backdrop-blur-md border border-white/20 shadow-sm hover:bg-white/90 text-zinc-800 dark:bg-black/40 dark:border-white/10 dark:text-white"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass" | null | undefined
  size?: "default" | "sm" | "lg" | "icon" | null | undefined
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
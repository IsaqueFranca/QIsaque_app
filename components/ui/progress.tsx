import * as React from "react"
import { cn } from "../../lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-sky-500 transition-all duration-500 ease-out rounded-full"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
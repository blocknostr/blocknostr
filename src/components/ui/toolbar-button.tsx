
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
ToolbarButton.displayName = "ToolbarButton"

export { ToolbarButton }


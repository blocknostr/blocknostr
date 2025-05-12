
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:overflow-hidden group-[.toaster]:transition-all",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          // Success toast styling - green theme
          success: "group-[.toast]:bg-[#F2FCE2] group-[.toast]:border-[#D9ECBC] group-[.toast]:text-[#365314]",
          // Error toast styling - subtle gray/black/white theme
          error: "group-[.toast]:bg-[#222222] group-[.toast]:border-[#333333] group-[.toast]:text-[#F1F1F1]",
          // Default action button styling
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border-none group-[.toast]:shadow-none",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Add animation classes for when toasts move up
          loader: "group-[.toast]:text-muted-foreground",
        },
        // Add styling for toast movement animation
        style: {
          transition: "all 0.2s ease-out",
          cursor: "pointer", // Make it clear toasts are clickable
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'

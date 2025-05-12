
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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:overflow-hidden group-[.toaster]:transition-all group-[.toaster]:cursor-pointer",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border-none group-[.toast]:shadow-none",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          loader: "group-[.toast]:text-muted-foreground",
          // Remove styling for closeButton since we're hiding it
          
          // Custom success style
          success: "group-[.toast]:bg-[#F2FCE2] group-[.toast]:border-green-200 group-[.toast]:text-green-800",
          
          // Subtle error style with gray/black/white theme
          error: "group-[.toast]:bg-neutral-100 dark:group-[.toast]:bg-neutral-800 group-[.toast]:border-neutral-200 dark:group-[.toast]:border-neutral-700 group-[.toast]:text-neutral-800 dark:group-[.toast]:text-neutral-200",
        },
        // Add styling for toast movement animation
        style: {
          transition: "all 0.2s ease-out",
        },
        ...props.toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'

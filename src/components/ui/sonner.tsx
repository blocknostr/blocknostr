
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
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border-none group-[.toast]:shadow-none",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Add animation classes for when toasts move up
          loader: "group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:text-foreground group-[.toast]:opacity-60 group-[.toast]:transition-opacity group-[.toast]:hover:opacity-100",
        },
        // Add styling for toast movement animation
        style: {
          transition: "all 0.2s ease-out",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'

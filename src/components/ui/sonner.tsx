
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, toast as sonnerToast, ToastT } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

// Create a wrapper for the toast function with our custom styling
const toast = {
  ...sonnerToast,
  success: (message: string | React.ReactNode, data?: any) =>
    sonnerToast(message, {
      ...data,
      className: "toast-success",
      icon: <CheckCircle2 className="h-4 w-4" />,
    }),
  error: (message: string | React.ReactNode, data?: any) =>
    sonnerToast.error(message, {
      ...data,
      className: "toast-error",
      icon: <AlertCircle className="h-4 w-4" />,
    }),
  info: (message: string | React.ReactNode, data?: any) =>
    sonnerToast.info(message, {
      ...data,
      className: "toast-info",
      icon: <Info className="h-4 w-4" />,
    }),
  warning: (message: string | React.ReactNode, data?: any) =>
    sonnerToast.warning(message, {
      ...data,
      className: "toast-warning",
      icon: <AlertTriangle className="h-4 w-4" />,
    }),
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      expand={false}
      duration={4000}
      richColors
      closeButton
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:text-foreground",
            "group-[.toaster]:border-border/40 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
            "group-[.toaster]:px-4 group-[.toaster]:py-3 backdrop-blur-sm",
            "group-[.toaster]:transition-all group-[.toaster]:duration-300",
            "group-[.toaster]:data-[state=open]:animate-in group-[.toaster]:data-[state=open]:slide-in-from-bottom-3",
            "group-[.toaster]:data-[state=closed]:animate-out group-[.toaster]:data-[state=closed]:slide-out-to-right-full",
            "group-[.toaster]:data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
            "group-[.toaster]:data-[swipe=cancel]:translate-x-0 group-[.toaster]:data-[swipe=cancel]:transition-[transform_200ms_ease-out]",
            "group-[.toaster]:data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] group-[.toaster]:data-[swipe=end]:animate-out"
          ),
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:shadow-sm hover:group-[.toast]:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:shadow-sm hover:group-[.toast]:bg-muted/90",
          title: "group-[.toast]:font-medium group-[.toast]:text-sm",
          error: "!bg-destructive/10 border-destructive/30 text-destructive shadow-sm shadow-destructive/10",
          success: "!bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10",
          info: "!bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/10",
          warning: "!bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 shadow-sm shadow-yellow-500/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

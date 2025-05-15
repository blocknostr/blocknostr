
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
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground",
            "group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md",
            "group-[.toaster]:px-4 group-[.toaster]:py-3"
          ),
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          title: "group-[.toast]:font-medium group-[.toast]:text-sm",
          error: "!bg-destructive/15 border-destructive/30 text-destructive",
          success: "!bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400",
          info: "!bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400",
          warning: "!bg-yellow-500/15 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };


import { toast as sonnerToast } from "sonner";

// Extend the toast function for better type compatibility
export const toast = sonnerToast;

// For backward compatibility, provide useToast as well
export const useToast = () => {
  return {
    toast: sonnerToast
  };
};

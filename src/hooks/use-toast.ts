
// Re-export from sonner as our toast hook
import { toast } from "sonner";

export { toast };

// For backward compatibility, provide useToast as well
export const useToast = () => {
  return {
    toast
  };
};

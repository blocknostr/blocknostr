
import { toast } from "sonner";

export const useCopySharable = () => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
      return true;
    } catch (error) {
      console.error("Failed to copy text: ", error);
      toast.error("Failed to copy link");
      return false;
    }
  };

  return { copyToClipboard };
};

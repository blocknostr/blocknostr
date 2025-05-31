
// Use Sonner as our main toast library
import { toast, Toaster as SonnerToaster } from "sonner";

// Re-export Sonner's toast API
export { toast, SonnerToaster as Toaster };

// No longer using the custom toast hook since we're standardizing on Sonner


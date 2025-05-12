
import { useState } from 'react';
import { toast } from 'sonner';

export function useProfileError() {
  const [error, setError] = useState<string | null>(null);
  
  const handleError = (message: string) => {
    setError(message);
    toast.error(message);
    return null;
  };
  
  const clearError = () => {
    setError(null);
  };
  
  return {
    error,
    setError,
    handleError,
    clearError
  };
}

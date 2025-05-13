
import { useState } from 'react';

/**
 * Hook to manage relay loading state
 */
export function useRelayLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const startLoading = () => {
    setIsLoading(true);
    setLoadError(null);
  };

  const endLoading = (error?: string) => {
    setIsLoading(false);
    if (error) {
      setLoadError(error);
    }
  };

  return {
    isLoading,
    loadError,
    startLoading,
    endLoading,
    setLoadError
  };
}

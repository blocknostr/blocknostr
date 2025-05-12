
import { useState, useEffect } from 'react';

interface UseConnectionStatusProps {
  loading: boolean;
  error: string | null;
  profileData: any | null;
}

export function useConnectionStatus({ loading, error, profileData }: UseConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track connection status
  useEffect(() => {
    if (loading) {
      setConnectionStatus('connecting');
    } else if (error) {
      setConnectionStatus('failed');
      setErrorMessage(error);
    } else if (profileData) {
      setConnectionStatus('connected');
      setErrorMessage(null);
    }
  }, [loading, error, profileData]);
  
  return {
    connectionStatus,
    errorMessage,
    setErrorMessage
  };
}

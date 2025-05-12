
import { useRef, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

/**
 * Custom hook to manage subscriptions cleanup for the You page
 */
export function useYouPageSubscriptions() {
  const refreshTimeoutRef = useRef<number | null>(null);
  const profileSavedTimeRef = useRef<number | null>(null);
  const subscriptionsRef = useRef<string[]>([]);

  // Clean up subscriptions and timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Clean up subscriptions safely
      try {
        if (typeof nostrService.unsubscribeAll === 'function') {
          nostrService.unsubscribeAll();
        } else {
          console.log("[YOU PAGE] unsubscribeAll not available, cleaning up individual subscriptions");
          // If unsubscribeAll doesn't exist, clean up any stored subscriptions
          subscriptionsRef.current.forEach(subId => {
            if (subId && typeof nostrService.unsubscribe === 'function') {
              nostrService.unsubscribe(subId);
            }
          });
        }
      } catch (err) {
        console.error("[YOU PAGE] Error while cleaning up subscriptions:", err);
      }
    };
  }, []);

  return {
    refreshTimeoutRef,
    profileSavedTimeRef,
    subscriptionsRef
  };
}

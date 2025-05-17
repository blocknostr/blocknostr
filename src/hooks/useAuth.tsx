
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

// Re-export the useAuth hook from the context for convenience
export const useAuth = useAuthContext;

// Utility hook to trigger auth events
export const useAuthEvents = () => {
  const { AUTH_EVENTS } = require("@/contexts/AuthContext");
  
  const emitLoginEvent = (pubkey: string) => {
    window.dispatchEvent(
      new CustomEvent(AUTH_EVENTS.LOGIN, { 
        detail: { pubkey }
      })
    );
  };
  
  const emitLogoutEvent = () => {
    window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGOUT));
  };
  
  return {
    emitLoginEvent,
    emitLogoutEvent
  };
};

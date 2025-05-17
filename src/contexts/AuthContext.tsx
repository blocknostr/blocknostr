
import React, { createContext, useContext, useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";

// Define the context type
interface AuthContextType {
  isLoggedIn: boolean;
  publicKey: string | null;
  npub: string;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  publicKey: null,
  npub: ""
});

// Event name constants
export const AUTH_EVENTS = {
  LOGIN: "nostr:login",
  LOGOUT: "nostr:logout"
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!nostrService.publicKey);
  const [publicKey, setPublicKey] = useState<string | null>(nostrService.publicKey);
  const [npub, setNpub] = useState<string>(nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : "");

  // Listen for login/logout events
  useEffect(() => {
    const handleLogin = (event: CustomEvent) => {
      const { pubkey } = event.detail;
      console.info("[AuthContext] Login event detected:", pubkey);
      setIsLoggedIn(true);
      setPublicKey(pubkey);
      setNpub(nostrService.formatPubkey(pubkey));
    };

    const handleLogout = () => {
      console.info("[AuthContext] Logout event detected");
      setIsLoggedIn(false);
      setPublicKey(null);
      setNpub("");
    };

    // Add event listeners
    window.addEventListener(AUTH_EVENTS.LOGIN, handleLogin as EventListener);
    window.addEventListener(AUTH_EVENTS.LOGOUT, handleLogout);

    // Initialize state from nostrService on mount
    const checkInitialState = () => {
      const pubkey = nostrService.publicKey;
      if (pubkey && !isLoggedIn) {
        setIsLoggedIn(true);
        setPublicKey(pubkey);
        setNpub(nostrService.formatPubkey(pubkey));
      }
    };
    checkInitialState();

    return () => {
      window.removeEventListener(AUTH_EVENTS.LOGIN, handleLogin as EventListener);
      window.removeEventListener(AUTH_EVENTS.LOGOUT, handleLogout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, publicKey, npub }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

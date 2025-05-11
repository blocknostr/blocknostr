
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

export function useWalletConnect() {
  const [hasNostrExtension, setHasNostrExtension] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { triggerHaptic } = useHapticFeedback();
  
  useEffect(() => {
    // Check for NIP-07 extension
    setHasNostrExtension(!!window.nostr);
    
    // Check if already connected
    const checkConnection = async () => {
      const pubkey = nostrService.publicKey;
      setIsConnected(!!pubkey);
    };
    
    checkConnection();
    
    // Re-check for extension periodically
    const intervalId = setInterval(() => {
      setHasNostrExtension(!!window.nostr);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = async () => {
    triggerHaptic('medium');
    
    if (!hasNostrExtension) {
      toast("No extension found", {
        description: "Please install a Nostr browser extension like Alby or nos2x",
        duration: 5000,
      });
      
      // Open extension info
      window.open("https://getalby.com/", "_blank");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Try to use NIP-07 login
      const success = await nostrService.login();
      if (success) {
        setIsConnected(true);
        triggerHaptic('success');
        toast("Successfully connected", {
          description: "Your Nostr extension is now connected to BlockNoster",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Connect error:", error);
      triggerHaptic('error');
      toast.error("Connection failed", {
        description: "Could not connect to your Nostr extension",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      triggerHaptic('warning');
      await nostrService.signOut();
      setIsConnected(false);
      toast.success("Wallet disconnected", {
        description: "Your wallet has been disconnected from BlockNoster",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to disconnect");
    }
  };

  return {
    hasNostrExtension,
    isConnecting,
    isConnected,
    handleConnect,
    handleLogout,
  };
}

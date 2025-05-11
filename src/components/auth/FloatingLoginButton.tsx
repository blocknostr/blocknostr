
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { LogIn, LogOut, Loader } from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

const FloatingLoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { triggerHaptic } = useHapticFeedback();

  // Check login status on mount
  useEffect(() => {
    const checkLogin = () => {
      const pubkey = nostrService.publicKey;
      setIsLoggedIn(!!pubkey);
    };
    
    checkLogin();
    
    // Re-check login status every few seconds in case it changes elsewhere
    const intervalId = setInterval(checkLogin, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    triggerHaptic('medium');
    
    try {
      const success = await nostrService.login();
      if (success) {
        setIsLoggedIn(true);
        triggerHaptic('success');
        toast.success("Successfully logged in");
      } else {
        triggerHaptic('error');
        toast.error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      triggerHaptic('error');
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    triggerHaptic('medium');
    
    try {
      nostrService.signOut();
      setIsLoggedIn(false);
      triggerHaptic('success');
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      triggerHaptic('error');
      toast.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed left-4 bottom-4 z-50">
      <Button
        onClick={isLoggedIn ? handleLogout : handleLogin}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-purple-500/20 transition-all duration-300"
        size="sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : isLoggedIn ? (
          <>
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4 mr-1" />
            Sign In
          </>
        )}
      </Button>
    </div>
  );
};

export default FloatingLoginButton;

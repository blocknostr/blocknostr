import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { nostrService } from "@/lib/nostr";
import { LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";

const LoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [npub, setNpub] = useState<string>("");
  
  useEffect(() => {
    // Check if user is already logged in
    const checkLogin = () => {
      const pubkey = nostrService.publicKey;
      if (pubkey) {
        setIsLoggedIn(true);
        setNpub(nostrService.formatPubkey(pubkey));
      } else {
        setIsLoggedIn(false);
        setNpub("");
      }
    };
    
    checkLogin();
  }, []);
  
  const handleLogin = async () => {
    try {
      const success = await nostrService.login();
      
      if (success) {
        const pubkey = nostrService.publicKey;
        if (pubkey) {
          setIsLoggedIn(true);
          setNpub(nostrService.formatPubkey(pubkey));
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    }
  };
  
  const handleLogout = async () => {
    await nostrService.signOut();
    setIsLoggedIn(false);
    setNpub("");
    toast.success("Signed out successfully");
  };
  
  if (isLoggedIn) {
    const shortNpub = npub.length > 14 
      ? `${npub.substring(0, 7)}...${npub.substring(npub.length - 7)}`
      : npub;
      
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => { window.location.href = "/profile"; }}
        >
          <User className="h-4 w-4" />
          <span>{shortNpub}</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-red-500" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <Button onClick={handleLogin} className="flex items-center gap-2">
      <LogIn className="h-4 w-4" />
      <span>Sign in with Nostr</span>
    </Button>
  );
};

export default LoginButton;

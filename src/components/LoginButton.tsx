
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { nostrService } from "@/lib/nostr";
import { LogIn, LogOut, User, AlertCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

const LoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [npub, setNpub] = useState<string>("");
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  
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
      
      // Check for NIP-07 extension
      setHasExtension(!!window.nostr);
    };
    
    checkLogin();
    
    // Re-check for extension periodically (it might be installed after page load)
    const intervalId = setInterval(() => {
      setHasExtension(!!window.nostr);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleLogin = async () => {
    try {
      if (!window.nostr) {
        toast.error(
          "No Nostr extension detected!", 
          { 
            description: "Please install Alby, nos2x, or another Nostr browser extension.",
            duration: 5000
          }
        );
        
        // Open links in a new tab
        window.open("https://getalby.com/", "_blank");
        return;
      }
      
      const success = await nostrService.login();
      
      if (success) {
        const pubkey = nostrService.publicKey;
        if (pubkey) {
          setIsLoggedIn(true);
          setNpub(nostrService.formatPubkey(pubkey));
          toast.success("Successfully logged in!");
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => { window.location.href = "/profile"; }}
              >
                <User className="h-4 w-4" />
                <span>{shortNpub}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View your profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign out</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={handleLogin} 
            className="flex items-center gap-2"
            variant={hasExtension ? "default" : "outline"}
          >
            {hasExtension ? (
              <>
                <Wallet className="h-4 w-4" />
                <span>Sign in with Nostr</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Install Nostr Extension</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {hasExtension ? 
            "Sign in using your Nostr extension" : 
            "Install Alby, nos2x or another Nostr extension"
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LoginButton;

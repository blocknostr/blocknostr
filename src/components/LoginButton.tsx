
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { LogOut, User, AlertCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import LoginDialog from "./auth/LoginDialog";

const LoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [npub, setNpub] = useState<string>("");
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState<boolean>(false);
  
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
    // Open login dialog instead of direct login
    setLoginDialogOpen(true);
  };
  
  const handleLogout = async () => {
    await nostrService.signOut();
    setIsLoggedIn(false);
    setNpub("");
    toast.success("Signed out successfully");
    
    // Reload the page to reset all states
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
                className="flex items-center gap-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                onClick={() => { window.location.href = "/profile"; }}
              >
                <User className="h-4 w-4 text-primary" />
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
                className="text-red-500 hover:bg-red-500/10 transition-colors" 
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
        
        {/* Login Dialog component */}
        <LoginDialog 
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
        />
      </div>
    );
  }
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleLogin} 
              className="flex items-center gap-2 bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary/80 hover:to-primary/70 transition-all"
              variant={hasExtension ? "default" : "outline"}
            >
              {hasExtension ? (
                <>
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Install Extension</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {hasExtension ? 
              "Connect with your Nostr wallet" : 
              "Install Alby, nos2x or another Nostr extension"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Login Dialog component */}
      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </>
  );
};

export default LoginButton;

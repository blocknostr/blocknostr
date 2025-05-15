
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { LogOut, User, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import LoginDialog from "./auth/LoginDialog";
import { cn } from "@/lib/utils";
import { useNostrAuth } from "@/hooks/useNostrAuth";

const LoginButton = () => {
  const { isLoggedIn, currentUserPubkey, logout } = useNostrAuth();
  const [npub, setNpub] = useState<string>("");
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    // Update npub when current user changes
    if (currentUserPubkey) {
      import('@/lib/nostr/utils/keys').then(({ formatPubkey }) => {
        setNpub(formatPubkey(currentUserPubkey));
      });
    } else {
      setNpub("");
    }
    
    // Check for NIP-07 extension
    setHasExtension(!!window.nostr);
    
    // Re-check for extension periodically (it might be installed after page load)
    const intervalId = setInterval(() => {
      setHasExtension(!!window.nostr);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [currentUserPubkey]);
  
  const handleLogin = async () => {
    // Open login dialog instead of direct login
    setLoginDialogOpen(true);
  };
  
  const handleLogout = async () => {
    await logout();
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
                <span className="font-normal">{shortNpub}</span>
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
              className={cn(
                "flex items-center gap-2 shadow-sm relative overflow-hidden",
                "transition-all duration-300",
                hasExtension ? 
                  "bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70 hover:bg-primary hover:shadow" : 
                  "bg-transparent border border-primary/20 hover:border-primary/30 hover:bg-primary/5"
              )}
              variant={hasExtension ? "default" : "outline"}
            >
              {/* Subtle inner shine effect */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100"></span>
              
              {hasExtension ? (
                <>
                  <Shield className="h-4 w-4" />
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
              "Install Alby, Alephium or nos2x extension"
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

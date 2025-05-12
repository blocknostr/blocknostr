
import React, { useState } from "react";
import { Shield, Wallet, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LoginDialog from "@/components/auth/LoginDialog";

interface LoginWelcomeBannerProps {
  onLoginClick: () => void;
}

const LoginWelcomeBanner: React.FC<LoginWelcomeBannerProps> = ({ onLoginClick }) => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  return (
    <>
      <div className="p-6 rounded-xl bg-gradient-to-br from-background/80 to-background/60 mb-6 shadow-md border border-border/30 animate-in fade-in slide-in-from-bottom-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="p-4 bg-primary/10 rounded-full shadow-inner border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
            <Shield className="h-10 w-10 text-primary relative z-10" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-light tracking-tight mb-2">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to BlockNoster
              </span>
            </h2>
            <p className="mb-5 text-muted-foreground">
              Connect your Nostr wallet to access the decentralized social network and interact with the Alephium blockchain.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button 
                onClick={handleLoginClick} 
                size="lg"
                className={cn(
                  "gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80", 
                  "shadow-md hover:shadow transition-all group relative overflow-hidden"
                )}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
              
              <a 
                href="https://nostr.how"
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="h-4 w-4 mr-1" /> 
                <span>What is Nostr?</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </>
  );
};

export default LoginWelcomeBanner;

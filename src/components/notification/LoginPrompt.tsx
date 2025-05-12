
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import LoginDialog from "@/components/auth/LoginDialog";
import { cn } from "@/lib/utils";

const LoginPrompt = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  return (
    <>
      <div className="p-8 text-center bg-gradient-to-b from-background/80 to-muted/10 rounded-lg border border-border/30 backdrop-blur-sm">
        <div className="p-3 bg-primary/10 rounded-full mx-auto mb-3 w-fit relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
          <Wallet className="h-8 w-8 text-primary relative z-10" />
        </div>
        <h3 className="text-xl font-light tracking-tight mb-2">Stay in the loop</h3>
        <p className="mb-4 text-muted-foreground max-w-sm mx-auto">
          Connect your Nostr wallet to see reactions, replies, and mentions from the community.
        </p>
        <Button 
          onClick={handleLoginClick} 
          className={cn(
            "gap-2 bg-gradient-to-r from-primary/90 to-primary/80", 
            "hover:from-primary/80 hover:to-primary/70 transition-all group relative overflow-hidden"
          )}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
      
      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </>
  );
};

export default LoginPrompt;

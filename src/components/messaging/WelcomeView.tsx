
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wallet } from "lucide-react";
import LoginDialog from "@/components/auth/LoginDialog";

interface WelcomeViewProps {
  onLogin: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onLogin }) => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4 bg-gradient-to-b from-background to-muted/10">
      <div className="p-4 bg-primary/10 rounded-full mb-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
        <MessageSquare className="h-12 w-12 text-primary relative z-10" />
      </div>
      <h2 className="text-xl font-semibold mb-1">Welcome to BlockMail</h2>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        Secure, encrypted messaging built on Nostr and Alephium blockchain
      </p>
      <Button 
        onClick={handleLoginClick}
        className="gap-2 bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary/80 hover:to-primary/70"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
      
      <p className="text-xs text-muted-foreground mt-4">
        Messages are encrypted using NIP-44 and signed with your keys
      </p>

      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </div>
  );
};

export default WelcomeView;

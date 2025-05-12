
import React from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeViewProps {
  onLogin?: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4 bg-gradient-to-b from-background to-muted/10">
      <div className="p-4 bg-primary/10 rounded-full mb-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
        <MessageSquare className="h-12 w-12 text-primary relative z-10" />
      </div>
      <h2 className="text-xl font-light tracking-tight mb-1">Welcome to BlockMail</h2>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        Secure, encrypted messaging built on Nostr and Alephium blockchain
      </p>
      <p className="text-center text-muted-foreground">
        Connect your Nostr wallet using the button in the top right corner to access your encrypted messages.
      </p>
      
      <p className="text-xs text-muted-foreground mt-4">
        Messages are encrypted using NIP-44 and signed with your keys
      </p>
    </div>
  );
};

export default WelcomeView;

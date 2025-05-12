
import React from "react";
import { Wallet } from "lucide-react";

const LoginPrompt = () => {
  return (
    <div className="p-8 text-center bg-gradient-to-b from-background/80 to-muted/10 rounded-lg border border-border/30 backdrop-blur-sm">
      <div className="p-3 bg-primary/10 rounded-full mx-auto mb-3 w-fit relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
        <Wallet className="h-8 w-8 text-primary relative z-10" />
      </div>
      <h3 className="text-xl font-light tracking-tight mb-2">Stay in the loop</h3>
      <p className="mb-4 text-muted-foreground max-w-sm mx-auto">
        Connect your Nostr wallet using the button in the top right corner to see reactions, replies, and mentions from the community.
      </p>
    </div>
  );
};

export default LoginPrompt;

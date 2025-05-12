
import React, { useState } from "react";
import { FileText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/auth/LoginDialog";
import { cn } from "@/lib/utils";

const NotesLoginPrompt = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  return (
    <>
      <div className="text-center py-12 border rounded-lg bg-gradient-to-b from-background/60 to-background/40 border-border/30 shadow-sm transition-all hover:shadow-md backdrop-blur-sm">
        <div className="p-3 bg-primary/10 rounded-full mx-auto mb-3 relative w-fit overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
          <FileText className="h-10 w-10 text-primary/80 relative z-10" />
        </div>
        <h3 className="font-normal text-lg mb-2">Your notes are waiting</h3>
        <p className="text-muted-foreground mb-4 max-w-xs mx-auto">Connect your Nostr wallet to view and manage your saved notes.</p>
        <Button 
          variant="outline" 
          onClick={() => setLoginDialogOpen(true)}
          className={cn(
            "gap-2 border-primary/20 hover:border-primary/30 bg-transparent", 
            "hover:bg-primary/5 transition-all group relative overflow-hidden"
          )}
        >
          <span className="absolute inset-0 w-full h-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></span>
          <Wallet className="h-4 w-4 text-primary" />
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

export default NotesLoginPrompt;

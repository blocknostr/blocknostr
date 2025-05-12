
import React, { useState } from "react";
import { FileText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/auth/LoginDialog";

const NotesLoginPrompt = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  return (
    <>
      <div className="text-center py-12 border rounded-lg bg-muted/10 border-muted/20 shadow-sm transition-all hover:bg-muted/20">
        <FileText className="mx-auto h-12 w-12 text-primary/50 mb-3" />
        <h3 className="font-medium mb-2">Your notes are waiting</h3>
        <p className="text-muted-foreground mb-4 max-w-xs mx-auto">Connect your Nostr wallet to view and manage your saved notes.</p>
        <Button 
          variant="outline" 
          onClick={() => setLoginDialogOpen(true)}
          className="gap-2 border-primary/20 hover:border-primary/30 bg-transparent hover:bg-primary/5"
        >
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


import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState } from "react";
import LoginDialog from "@/components/auth/LoginDialog";

const LoginPrompt = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  return (
    <div className="p-8 text-center bg-gradient-to-b from-background to-muted/10 rounded-lg border border-muted/20">
      <div className="p-3 bg-primary/10 rounded-full mx-auto mb-3 w-fit">
        <Wallet className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-medium mb-2">Stay in the loop</h3>
      <p className="mb-4 text-muted-foreground max-w-sm mx-auto">
        Connect your Nostr wallet to see reactions, replies, and mentions from the community.
      </p>
      <Button 
        onClick={handleLoginClick} 
        className="gap-2 bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary/80 hover:to-primary/70"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </div>
  );
};

export default LoginPrompt;

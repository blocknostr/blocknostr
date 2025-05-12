
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface WelcomeViewProps {
  onLogin: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
      <MessageSquare className="h-12 w-12 text-muted-foreground mb-1" />
      <h2 className="text-xl font-semibold mb-1">Welcome to BlockMail</h2>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        Secure, encrypted messaging built on Nostr and Alephium blockchain
      </p>
      <Button onClick={onLogin}>Login with Nostr</Button>
    </div>
  );
};

export default WelcomeView;


import React from "react";
import { Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginWelcomeBannerProps {
  onLoginClick: () => void;
}

const LoginWelcomeBanner: React.FC<LoginWelcomeBannerProps> = ({ onLoginClick }) => {
  return (
    <div className="p-6 border rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/70 dark:to-slate-900 mb-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-semibold mb-2">Welcome to BlockNoster</h2>
          <p className="mb-4 text-muted-foreground">
            Connect your Nostr wallet to access the decentralized social network and interact with the Alephium blockchain.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <Button 
              onClick={onLoginClick} 
              size="lg"
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect with Nostr
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginWelcomeBanner;

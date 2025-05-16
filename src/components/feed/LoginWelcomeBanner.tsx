
import React from "react";
import { ShieldCheck, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginWelcomeBannerProps {
  onLoginClick?: () => void;
}

const LoginWelcomeBanner: React.FC<LoginWelcomeBannerProps> = () => {
  return (
    <div className="p-5 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 mb-6 shadow border border-primary/10">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
        <div className="p-3 bg-primary/10 rounded-full shadow-inner border border-primary/20">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-semibold mb-2">
            Welcome to BlockNoster
          </h2>
          <p className="mb-4 text-muted-foreground">
            Connect your Nostr wallet to join the decentralized social network.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
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
  );
};

export default LoginWelcomeBanner;

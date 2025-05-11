
import React from "react";
import { ExternalLink } from "lucide-react";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

const WalletInfo: React.FC = () => {
  const { triggerHaptic } = useHapticFeedback();
  
  return (
    <div className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
      <p>Connect your wallet to access the BlockNoster decentralized ecosystem</p>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        <a 
          href="https://getalby.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
          onClick={() => triggerHaptic('light')}
        >
          Get Alby <ExternalLink className="ml-1 h-3 w-3" />
        </a>
        <a 
          href="https://github.com/fiatjaf/nos2x" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
          onClick={() => triggerHaptic('light')}
        >
          Get nos2x <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default WalletInfo;

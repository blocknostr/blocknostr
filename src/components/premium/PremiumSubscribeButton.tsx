
import React from "react";
import { BadgePercent, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface PremiumSubscribeButtonProps {
  className?: string;
}

const PremiumSubscribeButton = ({ className }: PremiumSubscribeButtonProps) => {
  const handleSubscribe = () => {
    // Placeholder for future premium subscription integration
    console.log("Premium subscribe clicked");
    
    toast.info("Premium Subscription", {
      description: "This is a placeholder. Premium subscription integration coming soon.",
      duration: 3000,
    });
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        <div className="relative p-6 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg group-hover:shadow-fuchsia-500/40 transition-all duration-300">
          <BadgePercent className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <Button
        onClick={handleSubscribe}
        size="lg"
        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium py-6 px-8 mt-6 rounded-xl shadow-lg hover:shadow-fuchsia-500/30 transition-all duration-300 w-full max-w-xs relative overflow-hidden"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-400/10 to-fuchsia-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
        <BadgePercent className="mr-2 h-5 w-5" />
        Subscribe to Premium
      </Button>
      
      <div className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        <p>Upgrade to BlockNoster Premium for exclusive features and benefits</p>
        <a 
          href="#" 
          className="flex items-center justify-center mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Learn more <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default PremiumSubscribeButton;


import React from "react";
import { Shield } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogHeaderProps {
  animateIn: boolean;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ animateIn }) => {
  return (
    <div className="space-y-4">
      {/* Logo container with premium gradient effect */}
      <div className="mx-auto relative w-16 h-16">
        {/* Animated gradient background */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-r from-primary/60 to-primary/40 blur-sm",
          "transition-all duration-500 ease-out",
          animateIn ? "scale-100 opacity-70" : "scale-90 opacity-0"
        )}/>
        
        {/* Inner circle with shield icon */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-background/90 to-background/70 border border-primary/20",
          "transition-all duration-500 ease-out delay-100",
          animateIn ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}>
          <Shield className={cn(
            "h-7 w-7 text-primary",
            "transition-all duration-500 ease-out delay-200",
            animateIn ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )} />
        </div>
      </div>
      
      {/* Title with refined typography */}
      <DialogTitle className={cn(
        "text-center text-xl font-light tracking-tight",
        "transition-all duration-500 ease-out delay-300",
        animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        Connect to BlockNoster
      </DialogTitle>
      
      {/* Subtitle */}
      <p className={cn(
        "text-center text-sm text-muted-foreground",
        "transition-all duration-500 ease-out delay-400",
        animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}>
        Choose a method to connect your Nostr identity
      </p>
    </div>
  );
};

export default DialogHeader;

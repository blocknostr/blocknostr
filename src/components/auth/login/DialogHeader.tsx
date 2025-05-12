
import React from "react";
import { Shield } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogHeaderProps {
  animateIn: boolean;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ animateIn }) => {
  return (
    <div className="space-y-3">
      <div className="mx-auto p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-2 transition-all duration-300 ease-in-out">
        <Shield className={cn(
          "h-6 w-6 text-primary transition-all duration-300",
          animateIn ? "opacity-100 scale-100" : "opacity-0 scale-90"
        )} />
      </div>
      <DialogTitle className={cn(
        "text-center text-xl font-light tracking-tight",
        "transition-all duration-300 ease-in-out",
        animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}>
        Connect to BlockNoster
      </DialogTitle>
    </div>
  );
};

export default DialogHeader;

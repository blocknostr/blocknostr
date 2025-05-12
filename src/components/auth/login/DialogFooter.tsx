
import React from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogFooterProps {
  onCancel: () => void;
  onConnect: () => void;
  activeTab: "extension" | "manual";
  isLoggingIn: boolean;
  hasExtension: boolean;
  connectStatus: 'idle' | 'connecting' | 'success' | 'error';
  animateIn: boolean;
}

const DialogFooter: React.FC<DialogFooterProps> = ({
  onCancel,
  onConnect,
  activeTab,
  isLoggingIn,
  hasExtension,
  connectStatus,
  animateIn
}) => {
  return (
    <div className={cn(
      "flex justify-between sm:justify-between gap-2 transition-all duration-300 ease-in-out mt-4",
      animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={connectStatus === 'connecting' || connectStatus === 'success'}
        className="border-border/50 hover:bg-accent/30"
      >
        Cancel
      </Button>
      
      {activeTab === "extension" && (
        <Button
          onClick={onConnect}
          disabled={isLoggingIn || !hasExtension || connectStatus === 'success'}
          className={cn(
            "relative overflow-hidden",
            hasExtension ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" : "opacity-50"
          )}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          {isLoggingIn ? (
            <div className="flex items-center">
              <span className="animate-pulse">Connecting...</span>
            </div>
          ) : connectStatus === 'success' ? (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Fingerprint className="h-4 w-4 mr-2" />
              <span>{hasExtension ? "Connect" : "Install Extension First"}</span>
            </div>
          )}
        </Button>
      )}
      
      {activeTab === "manual" && (
        <Button
          disabled={true}
          className="bg-primary/70 hover:bg-primary/80 opacity-50"
        >
          Coming Soon
        </Button>
      )}
    </div>
  );
};

export default DialogFooter;

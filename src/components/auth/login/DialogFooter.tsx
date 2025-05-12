
import React from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle, Loader2 } from "lucide-react";
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
      "flex justify-between gap-3 transition-all duration-500 ease-out mt-6",
      animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={connectStatus === 'connecting' || connectStatus === 'success'}
        className="border-border/50 hover:bg-accent/30 px-4"
      >
        Cancel
      </Button>
      
      {activeTab === "extension" && (
        <Button
          onClick={onConnect}
          size="sm"
          disabled={isLoggingIn || !hasExtension || connectStatus === 'success'}
          className={cn(
            "relative overflow-hidden px-6 transition-all duration-300",
            hasExtension ? 
              "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg" : 
              "opacity-50"
          )}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          {isLoggingIn ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Connecting...</span>
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
          size="sm"
          disabled={true}
          className="bg-primary/30 hover:bg-primary/40 opacity-50 px-6"
        >
          Coming Soon
        </Button>
      )}
    </div>
  );
};

export default DialogFooter;

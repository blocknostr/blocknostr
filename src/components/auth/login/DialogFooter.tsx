
import React from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogFooterProps {
  onConnect: () => void;
  activeTab: "extension" | "manual";
  isLoggingIn: boolean;
  hasExtension: boolean;
  connectStatus: 'idle' | 'connecting' | 'success' | 'error';
  animateIn: boolean;
}

const DialogFooter: React.FC<DialogFooterProps> = ({
  onConnect,
  activeTab,
  isLoggingIn,
  hasExtension,
  connectStatus,
  animateIn
}) => {
  return (
    <div className={cn(
      "flex justify-end transition-all duration-500 ease-out mt-6",
      animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
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

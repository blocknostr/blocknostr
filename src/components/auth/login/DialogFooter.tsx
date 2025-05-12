
import React from "react";
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
  activeTab,
  animateIn
}) => {
  return (
    <div className={cn(
      "flex justify-end transition-all duration-500 ease-out mt-3",
      animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Footer content can be added here if needed */}
    </div>
  );
};

export default DialogFooter;

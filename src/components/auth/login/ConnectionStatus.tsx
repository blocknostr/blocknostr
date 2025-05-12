
import React from "react";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  connectStatus: 'success' | 'error' | 'connecting' | 'idle';
  animateIn?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connectStatus, animateIn = true }) => {
  if (connectStatus === 'idle') return null;
  
  const statusConfig = {
    success: {
      icon: <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />,
      message: "Connected successfully!",
      className: "bg-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />,
      message: "Connection failed. Please try again.",
      className: "bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
    },
    connecting: {
      icon: <RefreshCw className="h-5 w-5 mr-3 flex-shrink-0 animate-spin" />,
      message: "Connecting to Nostr...",
      className: "bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    }
  };
  
  const { icon, message, className } = statusConfig[connectStatus];
  
  return (
    <div className={cn(
      "flex items-center p-3 rounded-lg",
      "animate-in fade-in slide-in-from-top-5 mb-4",
      className,
      animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      "transition-all duration-300 ease-in-out"
    )}>
      {icon}
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default ConnectionStatus;

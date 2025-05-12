
import React from "react";
import { CheckCircle } from "lucide-react";

interface ConnectionStatusProps {
  connectStatus: 'success' | 'error' | 'connecting' | 'idle';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connectStatus }) => {
  if (connectStatus !== 'success') return null;
  
  return (
    <div className="flex items-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 animate-in fade-in slide-in-from-top-5 mb-4">
      <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
      <span className="font-medium">Connected successfully!</span>
    </div>
  );
};

export default ConnectionStatus;


import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface YouPageHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
}

const YouPageHeader: React.FC<YouPageHeaderProps> = ({ refreshing, onRefresh }) => {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="font-semibold">Your Profile</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Profile
        </Button>
      </div>
    </header>
  );
};

export default YouPageHeader;


import React from "react";
import { Button } from "@/components/ui/button";

interface LeaveCommunityButtonProps {
  onLeave: () => void;
}

const LeaveCommunityButton = ({ onLeave }: LeaveCommunityButtonProps) => {
  return (
    <div className="mt-4">
      <Button 
        variant="outline" 
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={onLeave}
      >
        Leave Community
      </Button>
    </div>
  );
};

export default LeaveCommunityButton;


import React from "react";
import { Button } from "@/components/ui/button";

interface LeaveDaoButtonProps {
  onLeave: () => void;
  daoName?: string;
}

const LeaveDaoButton: React.FC<LeaveDaoButtonProps> = ({ onLeave, daoName = "DAO" }) => {
  return (
    <Button 
      variant="destructive" 
      onClick={onLeave}
      className="w-full"
    >
      Leave {daoName}
    </Button>
  );
};

export default LeaveDaoButton;

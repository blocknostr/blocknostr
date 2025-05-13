
import React from 'react';
import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";

interface InitiateVerificationButtonProps {
  isVerifying: boolean;
  onClick: () => void;
}

const InitiateVerificationButton = ({ 
  isVerifying, 
  onClick 
}: InitiateVerificationButtonProps) => {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="outline"
        className="flex items-center gap-2"
        disabled={isVerifying}
        onClick={onClick}
      >
        <Twitter className="h-4 w-4 text-blue-500" />
        {isVerifying ? "Opening Twitter..." : "Verify X Account"}
      </Button>
    </div>
  );
};

export default InitiateVerificationButton;

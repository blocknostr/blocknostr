
import { Button } from "@/components/ui/button";
import { Loader2, Twitter } from 'lucide-react';

interface InitiateVerificationButtonProps {
  isVerifying: boolean;
  onClick: () => void;
}

const InitiateVerificationButton = ({ isVerifying, onClick }: InitiateVerificationButtonProps) => {
  return (
    <Button 
      type="button"
      variant="outline"
      onClick={onClick}
      className="w-full flex items-center gap-2"
      disabled={isVerifying}
    >
      {isVerifying ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <><Twitter className="h-4 w-4" /> Verify X Account</>
      )}
    </Button>
  );
};

export default InitiateVerificationButton;

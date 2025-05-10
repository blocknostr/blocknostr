
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeaveCommunityButtonProps {
  onLeave: () => void;
  communityName: string;
}

const LeaveCommunityButton = ({ onLeave, communityName }: LeaveCommunityButtonProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConfirmLeave = () => {
    onLeave();
    setShowConfirmation(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
        onClick={() => setShowConfirmation(true)}
        size="sm"
      >
        <UserMinus className="h-4 w-4" />
        Leave Community
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Community?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <span className="font-semibold">{communityName}</span>? You'll no longer be able to participate in community discussions and proposals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-red-500 hover:bg-red-600">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeaveCommunityButton;

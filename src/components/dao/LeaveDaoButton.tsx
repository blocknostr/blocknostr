
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { LogOut } from "lucide-react";

interface LeaveDaoButtonProps {
  onLeave: () => void;
  daoName: string;
}

const LeaveDaoButton: React.FC<LeaveDaoButtonProps> = ({
  onLeave,
  daoName
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="text-destructive border-destructive/20 hover:bg-destructive/10"
        onClick={() => setShowConfirmation(true)}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Leave DAO
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to leave the DAO "{daoName}". You will no longer have access to member-only features unless you join again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onLeave();
                setShowConfirmation(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Leave DAO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeaveDaoButton;

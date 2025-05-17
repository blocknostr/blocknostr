
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
import { Trash2 } from "lucide-react";

interface DeleteDaoButtonProps {
  onDelete: () => Promise<void>;
  daoName: string;
  isDisabled?: boolean;
}

const DeleteDaoButton: React.FC<DeleteDaoButtonProps> = ({
  onDelete,
  daoName,
  isDisabled = false
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="text-destructive border-destructive hover:bg-destructive/10"
        onClick={() => setShowConfirmation(true)}
        disabled={isDisabled}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete DAO
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this DAO?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete the DAO "{daoName}". This action cannot be undone.
              All proposals and DAO data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete DAO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteDaoButton;


import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DAOPageHeaderProps {
  name: string;
  isMember: boolean;
  isCreator: boolean;
  isCreatorOnlyMember: boolean;
  currentUserPubkey: string | null;
  onJoinCommunity: () => Promise<void>;
  onLeaveCommunity: () => Promise<void>;
  onDeleteCommunity: () => Promise<void>;
  isPrivate?: boolean;
}

const DAOPageHeader = ({
  name,
  isMember,
  isCreator,
  isCreatorOnlyMember,
  currentUserPubkey,
  onJoinCommunity,
  onLeaveCommunity,
  onDeleteCommunity,
  isPrivate = false
}: DAOPageHeaderProps) => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);
  
  const handleJoin = async () => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to join a DAO");
      return;
    }
    
    setIsJoining(true);
    try {
      await onJoinCommunity();
      toast.success("Successfully joined DAO!");
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join DAO", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await onLeaveCommunity();
      toast.success("Successfully left DAO");
    } catch (error) {
      console.error("Error leaving DAO:", error);
      toast.error("Failed to leave DAO", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsLeaving(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteCommunity();
      toast.success("DAO deleted successfully");
      navigate("/dao");
    } catch (error) {
      console.error("Error deleting DAO:", error);
      toast.error("Failed to delete DAO", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };
  
  return (
    <>
      <div className="bg-background border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/dao")}
              size="icon"
              variant="ghost"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight">{name}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {!isMember && !isPrivate && (
              <Button 
                size="sm"
                onClick={handleJoin}
                disabled={isJoining || !currentUserPubkey}
              >
                <LogIn className="h-4 w-4 mr-1" />
                Join DAO
              </Button>
            )}
            
            {isMember && !isCreator && (
              <Button 
                size="sm"
                variant="outline"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Leave DAO
              </Button>
            )}
            
            {isCreator && !isCreatorOnlyMember && (
              <Button 
                size="sm"
                variant="outline"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Leave DAO
              </Button>
            )}
            
            {isCreator && isCreatorOnlyMember && (
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete DAO
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete DAO Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this DAO?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The DAO will be permanently deleted from the Nostr network.
              As you are the only member, deleting the DAO is the only way to remove it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete DAO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DAOPageHeader;

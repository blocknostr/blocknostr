
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserListItem from "./UserListItem";

interface FollowingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  following: string[];
  currentUserPubkey: string | null;
}

const FollowingDialog = ({ open, onOpenChange, following, currentUserPubkey }: FollowingDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {following.length === 0 ? (
            <div className="text-center text-muted-foreground">Not following anyone yet</div>
          ) : (
            <div className="space-y-4">
              {following.map((pubkey) => (
                <UserListItem 
                  key={pubkey} 
                  pubkey={pubkey} 
                  currentUserPubkey={currentUserPubkey}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowingDialog;

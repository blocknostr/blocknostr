
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserListItem from "./UserListItem";

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followers: string[];
  currentUserPubkey: string | null;
}

const FollowersDialog = ({ open, onOpenChange, followers, currentUserPubkey }: FollowersDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {followers.length === 0 ? (
            <div className="text-center text-muted-foreground">No followers yet</div>
          ) : (
            <div className="space-y-4">
              {followers.map((pubkey) => (
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

export default FollowersDialog;

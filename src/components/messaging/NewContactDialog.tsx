
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pubkeyValue: string;
  setPubkeyValue: (value: string) => void;
  onAddContact: () => void;
}

const NewContactDialog: React.FC<NewContactDialogProps> = ({
  open,
  onOpenChange,
  pubkeyValue,
  setPubkeyValue,
  onAddContact
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a new conversation</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enter a Nostr public key (npub) or hex key to add a new contact
          </p>
          <div className="space-y-4">
            <div className="grid gap-3">
              <Input
                placeholder="npub1... or hex key"
                value={pubkeyValue}
                onChange={(e) => setPubkeyValue(e.target.value)}
                className="rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  onOpenChange(false);
                  setPubkeyValue("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={onAddContact}
                className="bg-primary hover:bg-primary/90"
              >
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewContactDialog;

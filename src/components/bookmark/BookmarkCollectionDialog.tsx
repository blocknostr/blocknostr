
import React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BookmarkCollectionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  name: string;
  setName: (name: string) => void;
  color: string;
  setColor: (color: string) => void;
  description: string;
  setDescription: (description: string) => void;
  onCreateCollection: (name: string, color: string, description: string) => Promise<string | null>;
}

export function BookmarkCollectionDialog({
  isOpen,
  setIsOpen,
  name,
  setName,
  color,
  setColor,
  description,
  setDescription,
  onCreateCollection
}: BookmarkCollectionDialogProps) {
  const handleCreateCollection = async () => {
    if (!name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    
    try {
      const collectionId = await onCreateCollection(
        name,
        color,
        description
      );
      
      if (collectionId) {
        // Reset form
        setName("");
        setColor("#3b82f6");
        setDescription("");
        setIsOpen(false);
        toast.success(`Collection "${name}" created`);
      } else {
        toast.error("Failed to create collection");
      }
    } catch (error) {
      toast.error(`Error creating collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create collection</DialogTitle>
          <DialogDescription>
            Organize your bookmarks with collections
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="collection-name" className="text-xs">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Programming, Articles"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="collection-color" className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="collection-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 p-1"
              />
              <span className="text-xs">{color}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="collection-description" className="text-xs">Description (optional)</Label>
            <Input
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="h-8"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleCreateCollection}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

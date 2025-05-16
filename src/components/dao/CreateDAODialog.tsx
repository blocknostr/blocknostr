
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { DAO } from "@/types/dao";

interface CreateDAODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDAO: (dao: DAO) => void;
}

const CreateDAODialog: React.FC<CreateDAODialogProps> = ({ 
  open, 
  onOpenChange, 
  onCreateDAO 
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description) return;
    
    setIsSubmitting(true);
    
    const tags = tagsInput
      .split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
    
    // Create a new DAO with default values
    const newDao: DAO = {
      id: `dao-${Date.now()}`,
      name,
      description,
      image: image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop",
      creator: "user-pubkey-placeholder", // Would be the actual user's pubkey
      createdAt: Date.now(),
      members: ["user-pubkey-placeholder"], // Creator is the first member
      treasury: {
        balance: 0,
        tokenSymbol: "ALPH" 
      },
      proposals: 0,
      activeProposals: 0,
      tags: tags.length ? tags : ["new"]
    };
    
    // Simulate API call delay
    setTimeout(() => {
      onCreateDAO(newDao);
      
      // Reset form
      setName("");
      setDescription("");
      setImage("");
      setTagsInput("");
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Create DAO
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new DAO</DialogTitle>
            <DialogDescription>
              Create your own Decentralized Autonomous Organization to bring your community together
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome DAO"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is your DAO's mission?"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.png"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use a default image
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="finance, governance, social, etc."
              />
              <p className="text-xs text-muted-foreground">
                Comma separated list of tags
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create DAO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDAODialog;

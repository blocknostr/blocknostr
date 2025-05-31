import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";

interface CreateDAODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDAO: (name: string, description: string, tags: string[], avatar?: string, banner?: string) => Promise<string | null>;
  routePrefix?: 'dao' | 'communities'; // Add route prefix option
}

const CreateDAODialog: React.FC<CreateDAODialogProps> = ({
  open,
  onOpenChange,
  onCreateDAO,
  routePrefix = 'dao' // Default to 'dao' for backward compatibility
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const navigate = useNavigate();
  
  const resetForm = () => {
    setName("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setAvatar("");
    setBanner("");
    setIsSubmitting(false);
    setNameError("");
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  const validateName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("DAO name cannot be empty");
      return false;
    }
    
    setNameError("");
    return true;
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (newName.trim()) {
      setNameError("");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      toast.error("Please provide a valid DAO name");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const daoId = await onCreateDAO(name.trim(), description, tags, avatar.trim() || undefined, banner.trim() || undefined);
      if (daoId) {
        toast.success("DAO created successfully!", {
          description: "Redirecting to your new DAO..."
        });
        
        // Navigate to the newly created DAO after a short delay
        setTimeout(() => {
          navigate(`/${routePrefix}/${daoId}`);
        }, 500);
      }
      handleClose();
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast.error("Failed to create DAO");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      
      setTagInput("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new DAO</DialogTitle>
          <DialogDescription>
            Start a decentralized autonomous organization on Nostr to govern your community
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter DAO name"
              required
              maxLength={50}
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-red-500 text-sm mt-1">{nameError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your DAO's purpose and goals"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar Image URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 200x200px, max 500KB. Square format works best for avatars.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">Banner Image URL</Label>
            <Input
              id="banner"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x400px, max 1MB. Wide format (3:1 ratio) works best for banners.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="px-2 py-1 text-xs">
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    title={`Remove ${tag} tag`}
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags (press Enter)"
              onKeyDown={addTag}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create DAO"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDAODialog;


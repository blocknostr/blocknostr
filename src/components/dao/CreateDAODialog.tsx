
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAlephiumDApps, LinxLabsProject } from "@/lib/api/linxlabsApi";

interface CreateDAODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDAO: (name: string, description: string, tags: string[], alephiumProjectId?: string) => Promise<string | null>;
}

const CreateDAODialog: React.FC<CreateDAODialogProps> = ({
  open,
  onOpenChange,
  onCreateDAO
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [alephiumProjects, setAlephiumProjects] = useState<LinxLabsProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const navigate = useNavigate();
  
  // Fetch Alephium projects when dialog opens
  useEffect(() => {
    if (open) {
      const loadProjects = async () => {
        setLoadingProjects(true);
        try {
          const projects = await fetchAlephiumDApps();
          setAlephiumProjects(projects);
        } catch (error) {
          console.error("Failed to load Alephium projects:", error);
        } finally {
          setLoadingProjects(false);
        }
      };
      
      loadProjects();
    }
  }, [open]);
  
  const resetForm = () => {
    setName("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setIsSubmitting(false);
    setNameError("");
    setSelectedProjectId("");
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
      // Add selected project ID to onCreateDAO call
      const daoId = await onCreateDAO(name.trim(), description, tags, selectedProjectId || undefined);
      if (daoId) {
        toast.success("DAO created successfully!", {
          description: "Redirecting to your new DAO..."
        });
        
        // Navigate to the newly created DAO after a short delay
        setTimeout(() => {
          navigate(`/dao/${daoId}`);
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
  
  // Find the selected project to pre-populate tags if needed
  const handleProjectSelection = (projectId: string) => {
    setSelectedProjectId(projectId);
    
    if (projectId) {
      const selectedProject = alephiumProjects.find(project => project.id === projectId);
      if (selectedProject && selectedProject.tags && selectedProject.tags.length > 0) {
        // Add project tags if they're not already in the tags list
        const projectTags = selectedProject.tags.filter(tag => !tags.includes(tag));
        if (projectTags.length > 0) {
          setTags([...tags, ...projectTags]);
        }
      }
    }
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
            <Label htmlFor="alephium-project">Alephium Project (optional)</Label>
            <Select value={selectedProjectId} onValueChange={handleProjectSelection}>
              <SelectTrigger id="alephium-project" className="w-full" disabled={loadingProjects}>
                <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select an Alephium project"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {alephiumProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Link this DAO to an Alephium project for better discoverability
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

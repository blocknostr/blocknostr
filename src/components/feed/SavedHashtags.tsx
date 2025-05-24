
import React, { useState, useEffect } from "react";
import { X, Save, Hash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface SavedHashtagsProps {
  onTopicClick: (topic: string) => void;
}

const SavedHashtags: React.FC<SavedHashtagsProps> = ({ onTopicClick }) => {
  const [savedHashtags, setSavedHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Load saved hashtags from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedHashtags");
      if (saved) {
        setSavedHashtags(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved hashtags:", error);
    }
  }, []);
  
  // Save hashtags to localStorage when they change
  useEffect(() => {
    localStorage.setItem("savedHashtags", JSON.stringify(savedHashtags));
  }, [savedHashtags]);
  
  const handleSaveHashtag = () => {
    if (!newHashtag.trim()) return;
    
    // Remove # if it's included
    const tag = newHashtag.trim().replace(/^#/, '').toLowerCase();
    
    if (savedHashtags.includes(tag)) {
      toast.warning("This hashtag is already in your saved list");
      return;
    }
    
    setSavedHashtags((prev) => [...prev, tag]);
    setNewHashtag("");
    toast.success(`Added #${tag} to your saved hashtags`);
    setIsDialogOpen(false);
  };
  
  const handleRemoveHashtag = (tag: string) => {
    setSavedHashtags((prev) => prev.filter((t) => t !== tag));
    toast.success(`Removed #${tag} from your saved hashtags`);
  };
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Hash className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">Your Hashtags</h3>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add hashtag</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save a Hashtag</DialogTitle>
              <DialogDescription>
                Add a hashtag to your saved list for quick access
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center gap-2">
              <div className="text-lg font-medium">#</div>
              <Input 
                placeholder="Enter hashtag"
                value={newHashtag.replace(/^#/, '')} 
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveHashtag();
                }}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHashtag}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {savedHashtags.length > 0 ? (
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2">
            {savedHashtags.map((tag) => (
              <div 
                key={tag}
                className="flex items-center bg-accent rounded-full px-3 py-1"
              >
                <Button
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent text-xs mr-1"
                  onClick={() => onTopicClick(tag)}
                >
                  #{tag}
                </Button>
                <Button
                  variant="ghost"
                  className="h-5 w-5 p-0 rounded-full"
                  onClick={() => handleRemoveHashtag(tag)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove hashtag</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground text-sm py-2 bg-accent/20 rounded">
          Save hashtags for quick access
        </div>
      )}
    </div>
  );
};

export default SavedHashtags;

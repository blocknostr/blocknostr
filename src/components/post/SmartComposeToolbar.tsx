
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Hash } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import { toast } from "sonner";

interface SmartComposeToolbarProps {
  onHashtagClick: (hashtag: string) => void;
}

const SmartComposeToolbar: React.FC<SmartComposeToolbarProps> = ({
  onHashtagClick
}) => {
  const [savedHashtags, setSavedHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const maxVisibleTags = 7; // Limit visible tags to save space
  
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
  
  const handleRemoveHashtag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the badge click event
    setSavedHashtags((prev) => prev.filter((t) => t !== tag));
    toast.success(`Removed #${tag} from your saved hashtags`);
  };
  
  const hasMoreTags = savedHashtags.length > maxVisibleTags;
  const displayedTags = hasMoreTags 
    ? savedHashtags.slice(0, maxVisibleTags) 
    : savedHashtags;

  return (
    <div className="mt-2 relative">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-xs text-muted-foreground flex items-center">
          <Hash className="h-3.5 w-3.5 mr-1" />
          <span>Your tags:</span>
        </div>
      </div>
      
      <div className="relative pr-8"> {/* Create space for the add button */}
        <ScrollArea className="w-full whitespace-nowrap pb-1">
          <div className="flex space-x-1.5">
            {displayedTags.map((tag) => (
              <TooltipProvider key={tag}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline"
                      className="cursor-pointer hover:bg-accent py-0.5 text-xs flex items-center gap-1"
                      onClick={() => onHashtagClick(tag)}
                    >
                      #{tag}
                      <button 
                        className="hover:text-destructive ml-1 rounded-full h-3 w-3 inline-flex items-center justify-center"
                        onClick={(e) => handleRemoveHashtag(tag, e)}
                      >
                        <span className="text-xs">×</span>
                      </button>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    <p className="text-xs">Click to add #{tag} to your post</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {hasMoreTags && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline"
                      className="cursor-default py-0.5 text-xs"
                    >
                      +{savedHashtags.length - maxVisibleTags} more
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    <p className="text-xs">
                      {savedHashtags.slice(maxVisibleTags).map(tag => `#${tag}`).join(', ')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </ScrollArea>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 w-6 p-0 absolute right-0 top-0 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
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
      
      {savedHashtags.length === 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          No saved tags. Click <Plus className="h-3 w-3 inline" /> to add some.
        </div>
      )}
    </div>
  );
};

export default SmartComposeToolbar;

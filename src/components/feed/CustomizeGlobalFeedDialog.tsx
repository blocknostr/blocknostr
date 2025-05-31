
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';

interface CustomizeGlobalFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHashtags: string[];
  onSave: (hashtags: string[]) => void;
}

const CustomizeGlobalFeedDialog: React.FC<CustomizeGlobalFeedDialogProps> = ({
  open,
  onOpenChange,
  defaultHashtags,
  onSave,
}) => {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');

  // Initialize hashtags from props
  useEffect(() => {
    setHashtags(defaultHashtags || []);
  }, [defaultHashtags, open]);

  // Add a hashtag
  const addHashtag = () => {
    const tag = newHashtag.trim().toLowerCase().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setNewHashtag('');
    }
  };

  // Remove a hashtag
  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  // Handle key press (Enter to add hashtag)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  // Reset hashtags to default bitcoin, alephium, ergo
  const resetToDefault = () => {
    setHashtags(['bitcoin', 'alephium', 'ergo']);
  };

  // Handle save
  const handleSave = () => {
    onSave(hashtags);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Global Feed</DialogTitle>
          <DialogDescription>
            Select hashtags to include in your global feed. Posts containing any of these hashtags will appear.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current hashtags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Current hashtags</label>
            <div className="flex flex-wrap gap-2">
              {hashtags.length > 0 ? (
                hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 text-muted-foreground hover:text-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hashtags selected. Add some below or use the defaults.</p>
              )}
            </div>
          </div>

          {/* Add new hashtag */}
          <div>
            <label htmlFor="new-hashtag" className="text-sm font-medium mb-2 block">
              Add hashtag
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  #
                </span>
                <Input
                  id="new-hashtag"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value.replace(/^#/, ''))}
                  onKeyPress={handleKeyPress}
                  className="pl-7"
                  placeholder="Enter hashtag"
                />
              </div>
              <Button
                type="button"
                size="icon"
                onClick={addHashtag}
                disabled={!newHashtag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Popular hashtags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Popular hashtags</label>
            <div className="flex flex-wrap gap-2">
              {['bitcoin', 'alephium', 'ergo', 'nostr', 'crypto', 'defi', 'trading'].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    if (!hashtags.includes(tag)) {
                      setHashtags([...hashtags, tag]);
                    }
                  }}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefault}
            size="sm"
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset to default
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizeGlobalFeedDialog;


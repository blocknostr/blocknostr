
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Hash, 
  ChevronUp, 
  ChevronDown,
  Plus
} from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SmartComposeToolbarProps {
  onHashtagClick: (hashtag: string) => void;
}

const SmartComposeToolbar: React.FC<SmartComposeToolbarProps> = ({
  onHashtagClick
}) => {
  const [isHashtagsOpen, setIsHashtagsOpen] = useState(false);
  
  // Sample data (would come from props in a real implementation)
  const savedHashtags = ['bitcoin', 'nostr', 'alephium'];
  
  const toggleHashtags = () => {
    setIsHashtagsOpen(!isHashtagsOpen);
  };
  
  return (
    <div className="mt-2 border-t pt-2">
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 px-2 gap-1 rounded-full",
            isHashtagsOpen && "bg-primary/10 text-primary"
          )}
          onClick={toggleHashtags}
        >
          <Hash className="h-3.5 w-3.5" />
          <span className="text-xs">Your Tags</span>
          {isHashtagsOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <Collapsible 
        open={isHashtagsOpen}
        onOpenChange={setIsHashtagsOpen}
      >
        <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <ScrollArea className="max-h-32 overflow-y-auto p-1">
            <div className="flex flex-wrap gap-1.5 pt-1">
              {savedHashtags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  className="cursor-pointer hover:bg-accent px-2 py-0.5 text-xs"
                  onClick={() => onHashtagClick(tag)}
                >
                  #{tag}
                </Badge>
              ))}
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-accent px-2 py-0.5 text-xs"
              >
                <Plus className="h-2.5 w-2.5 mr-1" /> Add
              </Badge>
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SmartComposeToolbar;

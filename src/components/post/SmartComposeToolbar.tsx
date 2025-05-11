
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Hash, 
  MessageSquare, 
  TrendingUp, 
  ChevronUp, 
  ChevronDown,
  Plus
} from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SmartComposeToolbarProps {
  onHashtagClick: (hashtag: string) => void;
  onQuickReplyClick: (reply: string) => void;
}

const SmartComposeToolbar: React.FC<SmartComposeToolbarProps> = ({
  onHashtagClick,
  onQuickReplyClick
}) => {
  const [activeSection, setActiveSection] = useState<'hashtags' | 'trending' | 'replies' | null>(null);
  
  // Sample data (would come from props in a real implementation)
  const savedHashtags = ['bitcoin', 'nostr', 'alephium'];
  const trendingTopics = ['bitcoin', 'defi', 'privacy', 'web5', 'lightning'];
  const quickReplies = [
    "Thanks for sharing this!",
    "Interesting perspective",
    "I'd love to hear more about this",
    "Great post! Thanks for sharing."
  ];
  
  const toggleSection = (section: 'hashtags' | 'trending' | 'replies') => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };
  
  return (
    <div className="mt-2 border-t pt-2">
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 px-2 gap-1 rounded-full",
            activeSection === 'hashtags' && "bg-primary/10 text-primary"
          )}
          onClick={() => toggleSection('hashtags')}
        >
          <Hash className="h-3.5 w-3.5" />
          <span className="text-xs">Your Tags</span>
          {activeSection === 'hashtags' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 px-2 gap-1 rounded-full",
            activeSection === 'trending' && "bg-primary/10 text-primary"
          )}
          onClick={() => toggleSection('trending')}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs">Trending</span>
          {activeSection === 'trending' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 px-2 gap-1 rounded-full",
            activeSection === 'replies' && "bg-primary/10 text-primary"
          )}
          onClick={() => toggleSection('replies')}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-xs">Replies</span>
          {activeSection === 'replies' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <Collapsible 
        open={activeSection !== null}
        onOpenChange={(isOpen) => !isOpen && setActiveSection(null)}
      >
        <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <ScrollArea className="max-h-32 overflow-y-auto p-1">
            {activeSection === 'hashtags' && (
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
            )}
            
            {activeSection === 'trending' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {trendingTopics.map((topic) => (
                  <Badge 
                    key={topic} 
                    variant="outline"
                    className="cursor-pointer hover:bg-accent px-2 py-0.5 text-xs"
                    onClick={() => onHashtagClick(topic)}
                  >
                    #{topic}
                  </Badge>
                ))}
              </div>
            )}
            
            {activeSection === 'replies' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickReplies.map((reply, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 px-2 py-1 text-xs"
                    onClick={() => onQuickReplyClick(reply)}
                  >
                    {reply.length > 25 ? `${reply.substring(0, 25)}...` : reply}
                  </Badge>
                ))}
              </div>
            )}
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SmartComposeToolbar;

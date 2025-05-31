
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tags } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  className?: string;
}

export function TagFilter({ availableTags, selectedTags, onTagToggle, className }: TagFilterProps) {
  if (!availableTags.length) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Tags className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filter by tags</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
        {availableTags.map((tag) => (
          <Badge 
            key={tag} 
            variant={selectedTags.includes(tag) ? "default" : "outline"} 
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onTagToggle(tag)}
          >
            <Checkbox 
              id={`tag-${tag}`}
              checked={selectedTags.includes(tag)}
              className="h-3 w-3 mr-1"
              onCheckedChange={() => onTagToggle(tag)}
            />
            {tag}
          </Badge>
        ))}
      </div>
      
      {selectedTags.length > 0 && (
        <button 
          onClick={() => selectedTags.forEach(tag => onTagToggle(tag))}
          className="text-xs text-muted-foreground hover:text-primary mt-2 transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}


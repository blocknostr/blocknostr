
import React, { useState, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Tags } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = "Add tags...", maxTags = 5 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or comma
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      
      const newTag = inputValue.trim().toLowerCase();
      
      // Don't add duplicate tags
      if (value.includes(newTag)) {
        return;
      }
      
      // Check if we've hit the maximum number of tags
      if (value.length >= maxTags) {
        return;
      }
      
      onChange([...value, newTag]);
      setInputValue('');
    } 
    // Remove the last tag on Backspace if input is empty
    else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2 items-center border rounded-md p-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="px-2 py-1 flex items-center gap-1">
            {tag}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-destructive" 
              onClick={() => removeTag(tag)}
            />
          </Badge>
        ))}
        
        <div className="flex items-center flex-grow">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length < maxTags ? placeholder : `Maximum ${maxTags} tags`}
            className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6"
            disabled={value.length >= maxTags}
          />
          <Tags className="h-4 w-4 text-muted-foreground ml-2" />
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Press Enter to add a tag. {maxTags - value.length} tags remaining.
      </div>
    </div>
  );
}

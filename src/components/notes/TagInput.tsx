
import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags = 5
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or comma
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      
      const tagValue = inputValue.trim().toLowerCase();
      
      // Skip if tag already exists
      if (value.includes(tagValue)) {
        setInputValue('');
        return;
      }
      
      // Check maxTags limit
      if (value.length >= maxTags) {
        return;
      }
      
      // Add the tag
      onChange([...value, tagValue]);
      setInputValue('');
    }
    
    // Remove last tag on Backspace if input is empty
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-wrap gap-2 border rounded-md p-2 focus-within:ring-1 focus-within:ring-ring">
      {value.map(tag => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => removeTag(tag)}
          />
        </Badge>
      ))}
      
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length >= maxTags ? `Maximum ${maxTags} tags` : placeholder}
        disabled={value.length >= maxTags}
        className="flex-1 min-w-32 border-none shadow-none focus-visible:ring-0 p-0 h-7"
      />
    </div>
  );
}

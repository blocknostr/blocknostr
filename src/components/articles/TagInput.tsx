
import React, { KeyboardEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  setTags,
  placeholder = "Add tags...",
  maxTags = 10,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState("");
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === "") {
      // Remove the last tag if backspace is pressed and input is empty
      removeTag(tags.length - 1);
    } else if (e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const addTag = () => {
    const trimmedInput = inputValue.trim().toLowerCase();
    
    if (trimmedInput && !tags.includes(trimmedInput) && tags.length < maxTags) {
      setTags([...tags, trimmedInput]);
      setInputValue("");
    }
  };
  
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  return (
    <div className="border rounded-md p-1.5 flex flex-wrap gap-1.5">
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant="secondary"
          className="flex items-center gap-1 px-2"
        >
          {tag}
          <button 
            type="button" 
            onClick={() => removeTag(index)}
            disabled={disabled}
            className="rounded-full hover:bg-muted p-0.5"
          >
            <X size={12} />
            <span className="sr-only">Remove</span>
          </button>
        </Badge>
      ))}
      
      {tags.length < maxTags && (
        <Input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="border-none px-1 flex-grow min-w-[120px] focus-visible:ring-0 shadow-none h-7"
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default TagInput;


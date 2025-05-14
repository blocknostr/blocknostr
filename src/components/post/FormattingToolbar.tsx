
import React from 'react';
import { Bold, Italic, Link, Quote, List, ListOrdered, Image } from 'lucide-react';
import { ToolbarButton } from '@/components/ui/toolbar-button';

interface FormattingToolbarProps {
  onFormatClick: (format: string) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormatClick }) => {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-1">
      <ToolbarButton 
        onClick={() => onFormatClick('bold')}
        aria-label="Bold"
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => onFormatClick('italic')}
        aria-label="Italic"
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => onFormatClick('link')}
        aria-label="Link"
        title="Link"
      >
        <Link className="h-3.5 w-3.5" />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => onFormatClick('quote')}
        aria-label="Quote"
        title="Quote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => onFormatClick('ul')}
        aria-label="Bullet List"
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => onFormatClick('ol')}
        aria-label="Numbered List"
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => onFormatClick('image')}
        aria-label="Image"
        title="Image"
      >
        <Image className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
};

export default FormattingToolbar;

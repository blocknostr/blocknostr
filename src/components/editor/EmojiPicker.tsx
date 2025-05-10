
import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_CATEGORIES = {
  "Smileys & People": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘"],
  "Animals & Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵"],
  "Food & Drink": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝"],
  "Activity": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🏑", "🥍"],
  "Travel & Places": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚚", "🚛", "🚜", "🛴", "🚲", "🛵"],
  "Objects": ["⌚", "📱", "💻", "⌨️", "🖥️", "🖱️", "🖨️", "🖋️", "✒️", "🔍", "💡", "🔦", "🧰", "🔧", "🔨"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "♥️", "💯", "💢", "💬", "👁️‍🗨️", "🗯️", "💭", "💤"],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(EMOJI_CATEGORIES)[0]);
  const [open, setOpen] = useState(false);
  
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };
  
  const filteredEmojis = searchTerm 
    ? Object.values(EMOJI_CATEGORIES).flat().filter(emoji => emoji.includes(searchTerm))
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES];
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full"
          title="Add emoji"
        >
          <Smile className="h-4 w-4" />
          <span className="sr-only">Add emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 border-b">
          <input
            type="text"
            placeholder="Search emojis..."
            className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {!searchTerm && (
          <div className="flex overflow-x-auto p-1 border-b">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2 py-1 text-xs whitespace-nowrap ${
                  activeCategory === category ? 'bg-muted rounded-md font-medium' : ''
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        
        <div className="p-2 max-h-60 overflow-y-auto grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="text-xl hover:bg-muted p-1 rounded-md transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;

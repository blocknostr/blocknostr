
import React from 'react';
import { cn } from "@/lib/utils";

// Basic set of emojis for the picker
const EMOJI_CATEGORIES = {
  "Smileys & Emotion": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜"],
  "People & Body": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜"],
  "Animals & Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦄", "🐝", "🐛", "🦋", "🐌"],
  "Food & Drink": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽"],
  "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿"],
  "Travel & Places": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️", "🛺", "🚲", "🛴", "🛹", "🛼", "🚨", "🚥", "🚦"],
  "Objects": ["⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️"]
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [activeCategory, setActiveCategory] = React.useState<string>(Object.keys(EMOJI_CATEGORIES)[0]);
  
  return (
    <div className="emoji-picker p-2">
      <div className="flex overflow-x-auto scrollbar-hide pb-2 mb-2 border-b border-border/30">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-200",
              activeCategory === category 
                ? "bg-primary/10 text-primary rounded-md font-medium" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md"
            )}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-8 gap-1.5 p-1">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onEmojiSelect(emoji)}
            className={cn(
              "text-xl p-1.5 hover:bg-accent rounded-md transition-all duration-200",
              "hover:scale-110 active:scale-95"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;

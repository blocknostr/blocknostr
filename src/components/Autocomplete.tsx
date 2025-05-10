
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";

interface AutocompleteProps {
  content: string;
  onSelect: (value: string) => void;
  type: 'hashtag' | 'tag';
}

export const Autocomplete = ({ content, onSelect, type }: AutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // This is a simplified implementation
  // In a real app, you might fetch popular hashtags/names from a backend
  const mockHashtags = ['nostr', 'bitcoin', 'alephium', 'blocknoster', 'defi', 'web3'];
  const mockUsers = ['jack', 'satoshi', 'vitalik', 'gavin', 'hal'];

  useEffect(() => {
    // Detect if user is typing a hashtag or mention
    const lastWordMatch = type === 'hashtag' 
      ? content.match(/#(\w*)$/)
      : content.match(/@(\w*)$/);
    
    if (lastWordMatch) {
      const term = lastWordMatch[1].toLowerCase();
      setSearchTerm(term);
      
      let matches: string[];
      if (type === 'hashtag') {
        matches = mockHashtags.filter(tag => 
          tag.toLowerCase().startsWith(term)
        );
      } else {
        matches = mockUsers.filter(user => 
          user.toLowerCase().startsWith(term)
        );
      }
      
      setSuggestions(matches);
      setIsVisible(matches.length > 0);
    } else {
      setIsVisible(false);
    }
  }, [content, type]);

  const handleSelect = (suggestion: string) => {
    let replacement = type === 'hashtag' ? `#${suggestion} ` : `@${suggestion} `;
    
    // Replace the current hashtag/mention with the selected one
    const regex = type === 'hashtag' ? /#\w*$/ : /@\w*$/;
    const newContent = content.replace(regex, replacement);
    
    onSelect(newContent);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="absolute mt-1 z-10 w-48 max-h-64 overflow-y-auto p-1 shadow-lg">
      <ul className="space-y-1">
        {suggestions.map((suggestion) => (
          <li 
            key={suggestion}
            className="px-2 py-1 cursor-pointer hover:bg-accent rounded"
            onClick={() => handleSelect(suggestion)}
          >
            {type === 'hashtag' ? `#${suggestion}` : `@${suggestion}`}
          </li>
        ))}
      </ul>
    </Card>
  );
};

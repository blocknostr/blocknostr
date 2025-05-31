
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ArticleSearchProps {
  onSearch: (query: string) => void;
  onTagSelect: (tag: string | null) => void;
  selectedTag: string | null;
}

// Popular tags for the article feed
const popularTags = [
  "blockchain", "alephium", "nostr", "crypto", "programming", 
  "technology", "design", "defi", "web3", "development"
];

const ArticleSearch: React.FC<ArticleSearchProps> = ({ onSearch, onTagSelect, selectedTag }) => {
  const [searchInput, setSearchInput] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };
  
  const handleClear = () => {
    setSearchInput("");
    onSearch("");
    onTagSelect(null);
  };
  
  const handleTagClick = (tag: string) => {
    onTagSelect(selectedTag === tag ? null : tag);
    setSearchInput("");
    onSearch("");
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <Input
          placeholder="Search articles..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pr-16"
        />
        <div className="absolute right-1 top-1 flex space-x-1">
          {(searchInput || selectedTag) && (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleClear}
              className="h-8 w-8"
            >
              <X size={16} />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
          <Button type="submit" size="icon" className="h-8 w-8">
            <Search size={16} />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>
      
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground pt-1">
          Popular:
        </span>
        {popularTags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleTagClick(tag)}
          >
            #{tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ArticleSearch;



import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

const SearchPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // In a real implementation, this would connect to Nostr and search for events
      // For now, we'll just simulate a search
      console.log("Searching for:", searchQuery);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults = [
        { id: 1, content: `Post about ${searchQuery}`, author: "User1", pubkey: "npub1..." },
        { id: 2, content: `Another post with ${searchQuery}`, author: "User2", pubkey: "npub2..." },
        { id: 3, content: `Discussion about ${searchQuery}`, author: "User3", pubkey: "npub3..." },
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <div className="flex items-center rounded-full bg-muted/60 focus-within:bg-background focus-within:border focus-within:border-primary">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="flex-1 border-none bg-transparent pl-10 focus-visible:ring-0 rounded-full"
          />
        </div>
        
        {isFocused && (searchResults.length > 0 || isSearching) && (
          <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((result) => (
                  <Link 
                    key={result.id} 
                    to={`/profile/${result.pubkey}`}
                    className="block px-4 py-2 hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="font-medium">{result.author}</div>
                    <div className="text-sm text-muted-foreground truncate">{result.content}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {searchResults.length > 0 && !isFocused && (
        <div className="mt-4 bg-background border rounded-xl overflow-hidden">
          <div className="p-3 font-semibold border-b">Search Results</div>
          <div className="divide-y">
            {searchResults.map((result) => (
              <Link 
                key={result.id} 
                to={`/profile/${result.pubkey}`}
                className="block p-3 hover:bg-muted/50"
              >
                <div className="font-medium">{result.author}</div>
                <div className="text-sm text-muted-foreground">{result.content}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;

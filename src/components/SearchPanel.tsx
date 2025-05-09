
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
        { id: 1, content: `Post about ${searchQuery}`, author: "User1" },
        { id: 2, content: `Another post with ${searchQuery}`, author: "User2" },
        { id: 3, content: `Discussion about ${searchQuery}`, author: "User3" },
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for topics, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {isSearching ? (
            <div className="mt-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <div 
                  key={result.id} 
                  className="p-2 bg-muted/50 rounded-md hover:bg-muted cursor-pointer"
                >
                  <div className="font-medium">{result.author}</div>
                  <div className="text-sm">{result.content}</div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchPanel;

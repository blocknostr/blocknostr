import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Command, 
  CommandDialog,
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { DEMO_PROFILES, DEV_CONFIG } from "@/constants";

const GlobalSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ FIXED: Use configurable demo profiles instead of hardcoded values
  const demoProfiles = DEV_CONFIG.SHOW_DEMO_PROFILES ? DEMO_PROFILES.map(profile => ({
    name: profile.name,
    npub: profile.npub,
    picture: profile.picture
  })) : [];

  const searchTopics = [
    { name: "Bitcoin" },
    { name: "Nostr" },
    { name: "Lightning" },
    { name: "Decentralization" },
    { name: "Web5" },
  ];

  const toggleSearch = () => setIsOpen(!isOpen);

  const handleSelect = (type: string, value: string) => {
    if (type === 'people') {
      navigate(`/profile/${value}`);
    } else if (value.startsWith('npub') || value.startsWith('nprofile')) {
      // Navigate to home since profile pages are removed
      navigate(`/`);
    } else {
      // Handle topic selection
      setSearchTerm(value);
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative w-full max-w-md">
        <Button 
          variant="outline" 
          className="w-full justify-between border border-input bg-background hover:bg-accent text-muted-foreground" 
          onClick={toggleSearch}
        >
          <div className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            <span>Search topics or people...</span>
          </div>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">⌘K</kbd>
        </Button>
      </div>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Search topics or people..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="People">
            {demoProfiles
              .filter(person => 
                person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.npub.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(person => (
                <CommandItem 
                  key={person.npub}
                  onSelect={() => handleSelect('people', person.npub)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={person.picture} alt={person.name} />
                    <AvatarFallback>{person.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{person.name}</span>
                  <span className="text-xs text-muted-foreground">{person.npub.substring(0, 8)}...</span>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Topics">
            {searchTopics
              .filter(topic => 
                topic.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(topic => (
                <CommandItem 
                  key={topic.name}
                  onSelect={() => handleSelect('topic', topic.name)}
                >
                  #{topic.name}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;



import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatSerialNumber } from "@/lib/community-utils";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholderText?: string;
}

const SearchBar = ({ searchTerm, setSearchTerm, placeholderText = "Search communities..." }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholderText}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <span className="text-xs text-muted-foreground">
          Search by name or #ABC123
        </span>
      </div>
    </div>
  );
};

export default SearchBar;

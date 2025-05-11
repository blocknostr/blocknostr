
import React from "react";
import { Bookmark, Grid3X3, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookmarkHeaderProps {
  viewMode: "list" | "grid";
  setViewMode: (mode: "list" | "grid") => void;
  sortBy: "newest" | "oldest";
  setSortBy: (sort: "newest" | "oldest") => void;
}

const BookmarkHeader: React.FC<BookmarkHeaderProps> = ({ 
  viewMode, 
  setViewMode, 
  sortBy, 
  setSortBy 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <h1 className="text-lg font-medium flex items-center gap-2">
        <Bookmark className="h-4 w-4" />
        Bookmarks
      </h1>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={viewMode === "list" ? "bg-secondary/50" : ""}
          onClick={() => setViewMode("list")}
        >
          <ListFilter className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={viewMode === "grid" ? "bg-secondary/50" : ""}
          onClick={() => setViewMode("grid")}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "newest" | "oldest")}
        >
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BookmarkHeader;


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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Bookmarks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your saved notes appear here
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={viewMode === "list" ? "bg-muted" : ""}
          onClick={() => setViewMode("list")}
        >
          <ListFilter className="h-4 w-4 mr-1" />
          List
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={viewMode === "grid" ? "bg-muted" : ""}
          onClick={() => setViewMode("grid")}
        >
          <Grid3X3 className="h-4 w-4 mr-1" />
          Grid
        </Button>
        
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "newest" | "oldest")}
        >
          <SelectTrigger className="w-[120px]">
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

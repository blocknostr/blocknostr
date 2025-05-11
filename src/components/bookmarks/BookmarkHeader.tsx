
import React from "react";
import { Grid3X3, ListFilter } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className={viewMode === "list" ? "bg-secondary/50" : ""}
        onClick={() => setViewMode("list")}
        title="List view"
      >
        <ListFilter className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={viewMode === "grid" ? "bg-secondary/50" : ""}
        onClick={() => setViewMode("grid")}
        title="Grid view"
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
  );
};

export default BookmarkHeader;

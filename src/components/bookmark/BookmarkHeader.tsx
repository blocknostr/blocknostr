
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  Clock, 
  Zap,
  RefreshCw,
  WifiOff 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = 'newest' | 'oldest' | 'popular';

interface BookmarkHeaderProps {
  viewMode: "list" | "grid";
  setViewMode: (mode: "list" | "grid") => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  isOnline?: boolean;
  refreshBookmarks?: () => Promise<void>;
  isLoading?: boolean;
}

export function BookmarkHeader({
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  isOnline = true,
  refreshBookmarks,
  isLoading = false
}: BookmarkHeaderProps) {
  return (
    <div className="flex items-center space-x-2">
      {!isOnline && (
        <div className="flex items-center text-yellow-500 mr-1">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs">Offline</span>
        </div>
      )}
      
      {refreshBookmarks && (
        <Button 
          variant="outline" 
          size="icon"
          onClick={refreshBookmarks}
          disabled={isLoading}
          title="Refresh bookmarks"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" title="Sort bookmarks">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <DropdownMenuRadioItem value="newest" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Newest first
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="oldest" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Oldest first
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="popular" className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Most popular
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
        title={viewMode === "list" ? "Grid view" : "List view"}
      >
        {viewMode === "list" ? (
          <LayoutGrid className="h-4 w-4" />
        ) : (
          <List className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

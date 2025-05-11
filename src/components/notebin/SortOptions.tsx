
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Calendar, SortAsc, SortDesc } from "lucide-react";

export type SortOption = "newest" | "oldest" | "az" | "za" | "language";

interface SortOptionsProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const SortOptions = ({ currentSort, onSortChange }: SortOptionsProps) => {
  const sortLabels: Record<SortOption, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    az: "Title A-Z",
    za: "Title Z-A",
    language: "By language",
  };

  const getSortIcon = () => {
    switch (currentSort) {
      case "newest":
        return <ArrowDownNarrowWide className="h-4 w-4" />;
      case "oldest":
        return <ArrowUpNarrowWide className="h-4 w-4" />;
      case "az":
        return <SortAsc className="h-4 w-4" />;
      case "za":
        return <SortDesc className="h-4 w-4" />;
      case "language":
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {getSortIcon()}
          <span>Sort: {sortLabels[currentSort]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort Notes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onSortChange("newest")}
          className={currentSort === "newest" ? "bg-muted" : ""}
        >
          <ArrowDownNarrowWide className="h-4 w-4 mr-2" />
          Newest first
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onSortChange("oldest")}
          className={currentSort === "oldest" ? "bg-muted" : ""}
        >
          <ArrowUpNarrowWide className="h-4 w-4 mr-2" />
          Oldest first
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onSortChange("az")}
          className={currentSort === "az" ? "bg-muted" : ""}
        >
          <SortAsc className="h-4 w-4 mr-2" />
          Title A-Z
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onSortChange("za")}
          className={currentSort === "za" ? "bg-muted" : ""}
        >
          <SortDesc className="h-4 w-4 mr-2" />
          Title Z-A
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onSortChange("language")}
          className={currentSort === "language" ? "bg-muted" : ""}
        >
          <Calendar className="h-4 w-4 mr-2" />
          By language
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

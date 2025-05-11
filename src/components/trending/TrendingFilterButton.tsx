
import React from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrendingFilterButtonProps {
  className?: string;
}

const TrendingFilterButton: React.FC<TrendingFilterButtonProps> = ({ className }) => {
  return (
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-7 px-1.5 gap-1">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Filters</span>
      </Button>
    </DropdownMenuTrigger>
  );
};

export default TrendingFilterButton;

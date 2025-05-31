
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
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:inline-block">Filters</span>
      </Button>
    </DropdownMenuTrigger>
  );
};

export default TrendingFilterButton;


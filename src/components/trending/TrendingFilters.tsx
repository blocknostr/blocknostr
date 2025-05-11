
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { FilterOption, TimeOption } from "./types";

interface TrendingFiltersProps {
  currentFilter?: FilterOption;
  currentTime?: TimeOption;
}

const TrendingFilters: React.FC<TrendingFiltersProps> = ({ currentFilter, currentTime }) => {
  return (
    <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
      {currentFilter && (
        <Badge variant="outline" className="flex items-center gap-1 bg-background">
          {currentFilter.icon}
          <span>{currentFilter.label}</span>
        </Badge>
      )}
      {currentTime && (
        <Badge variant="outline" className="flex items-center gap-1 bg-background">
          <Clock className="h-3 w-3" />
          <span>{currentTime.label}</span>
        </Badge>
      )}
    </div>
  );
};

export default TrendingFilters;

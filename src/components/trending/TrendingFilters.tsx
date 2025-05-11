
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
    <div className="px-3 pb-1 flex flex-wrap items-center gap-1">
      {currentFilter && (
        <Badge variant="outline" className="flex items-center gap-1 bg-background text-xs py-0 h-5">
          {currentFilter.icon}
          <span>{currentFilter.label}</span>
        </Badge>
      )}
      {currentTime && (
        <Badge variant="outline" className="flex items-center gap-1 bg-background text-xs py-0 h-5">
          <Clock className="h-3 w-3" />
          <span>{currentTime.label}</span>
        </Badge>
      )}
    </div>
  );
};

export default TrendingFilters;


import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { FilterOption, TimeOption } from "./types";

interface TrendingFiltersProps {
  currentFilter?: FilterOption;
  currentTime?: TimeOption;
}

const TrendingFilters: React.FC<TrendingFiltersProps> = ({ currentFilter, currentTime }) => {
  if (!currentFilter && !currentTime) return null;
  
  return (
    <div className="px-3 pb-1 flex flex-wrap items-center gap-1.5">
      {currentFilter && (
        <Badge variant="outline" className="flex items-center gap-1 bg-background text-xs py-0.5 h-5">
          {React.cloneElement(currentFilter.icon as React.ReactElement, { className: "h-2.5 w-2.5" })}
          <span>{currentFilter.label}</span>
        </Badge>
      )}
      {currentTime && (
        <Badge variant="outline" className="flex items-center gap-1 bg-background text-xs py-0.5 h-5">
          <Clock className="h-2.5 w-2.5" />
          <span>{currentTime.label}</span>
        </Badge>
      )}
    </div>
  );
};

export default TrendingFilters;

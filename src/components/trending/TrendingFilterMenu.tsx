
import React from "react";
import {
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FilterOptionItem from "./FilterOptionItem";
import TimeOptionItem from "./TimeOptionItem";
import { FilterOption, TimeOption } from "./types";

interface TrendingFilterMenuProps {
  filterOptions: FilterOption[];
  timeOptions: TimeOption[];
  activeFilter: string;
  timeRange: string;
  setActiveFilter: (filter: string) => void;
  setTimeRange: (time: string) => void;
}

const TrendingFilterMenu: React.FC<TrendingFilterMenuProps> = ({
  filterOptions,
  timeOptions,
  activeFilter,
  timeRange,
  setActiveFilter,
  setTimeRange,
}) => {
  return (
    <DropdownMenuContent align="end" className="w-56">
      <div className="px-2 py-1.5 text-sm font-semibold">
        Category
      </div>
      {filterOptions.map(option => (
        <FilterOptionItem 
          key={option.value}
          isActive={option.value === activeFilter}
          onClick={() => setActiveFilter(option.value)}
          icon={option.icon}
          label={option.label}
        />
      ))}
      
      <DropdownMenuSeparator />
      
      <div className="px-2 py-1.5 text-sm font-semibold">
        Time Range
      </div>
      {timeOptions.map(option => (
        <TimeOptionItem 
          key={option.value}
          isActive={option.value === timeRange}
          onClick={() => setTimeRange(option.value)}
          label={option.label}
        />
      ))}
    </DropdownMenuContent>
  );
};

export default TrendingFilterMenu;

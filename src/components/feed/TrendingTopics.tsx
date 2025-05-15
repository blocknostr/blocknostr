
import React from "react";
import { Hash, SlidersHorizontal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTrendingTopicsData } from "@/components/trending/hooks/useTrendingTopicsData";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import FilterOptionItem from "@/components/trending/FilterOptionItem";
import TimeOptionItem from "@/components/trending/TimeOptionItem";
import { TrendingSection } from "@/components/trending";

interface TrendingTopicsProps {
  onTopicClick: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ 
  onTopicClick, 
  activeHashtag,
  onClearHashtag
}) => {
  // Instead of using the internal trending logic here,
  // we'll use the TrendingSection component which has been updated
  // to show the activeHashtag
  return (
    <TrendingSection 
      onTopicClick={onTopicClick}
      activeHashtag={activeHashtag}
      onClearHashtag={onClearHashtag}
    />
  );
};

export default TrendingTopics;

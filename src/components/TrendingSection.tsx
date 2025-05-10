
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { 
  Filter, 
  TrendingUp, 
  ZapIcon, 
  Heart, 
  Clock, 
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrendingSectionProps {
  onTopicClick?: (topic: string) => void;
}

type FilterType = "popular" | "zapped" | "liked";
type TimeRange = "all" | "24h" | "7d";
type FilterOption = {
  value: FilterType;
  label: string;
  icon: React.ReactNode;
};
type TimeOption = {
  value: TimeRange;
  label: string;
};

const TrendingSection = ({ onTopicClick }: TrendingSectionProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("popular");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const filterOptions: FilterOption[] = [
    { value: "popular", label: "Popular", icon: <TrendingUp className="h-4 w-4" /> },
    { value: "zapped", label: "Most Zapped", icon: <ZapIcon className="h-4 w-4" /> },
    { value: "liked", label: "Most Liked", icon: <Heart className="h-4 w-4" /> }
  ];
  
  const timeOptions: TimeOption[] = [
    { value: "all", label: "All time" },
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" }
  ];
  
  // This would be fetched from Nostr in a real implementation
  const allTimeTrendingTopics = [
    { name: "Bitcoin", posts: "124K" },
    { name: "Nostr", posts: "87K" },
    { name: "Lightning", posts: "65K" },
    { name: "Decentralization", posts: "42K" },
    { name: "Web5", posts: "38K" },
  ];

  const last24HTrendingTopics = [
    { name: "Bitcoin", posts: "18K" },
    { name: "AI", posts: "15K" },
    { name: "Nostr", posts: "12K" },
    { name: "OpenAI", posts: "10K" },
    { name: "Tech", posts: "8K" },
  ];

  const last7DTrendingTopics = [
    { name: "Bitcoin", posts: "56K" },
    { name: "Nostr", posts: "43K" },
    { name: "Lightning", posts: "32K" },
    { name: "Ethereum", posts: "28K" },
    { name: "Privacy", posts: "21K" },
  ];

  const mostZappedTopics = {
    all: [
      { name: "Bitcoin", posts: "98K" },
      { name: "Nostr", posts: "76K" },
      { name: "Sats", posts: "54K" },
      { name: "Lightning", posts: "41K" },
      { name: "BTC", posts: "32K" },
    ],
    "24h": [
      { name: "Bitcoin", posts: "14K" },
      { name: "Nostr", posts: "11K" },
      { name: "Lightning", posts: "8K" },
      { name: "Sats", posts: "7K" },
      { name: "Decentralization", posts: "5K" },
    ],
    "7d": [
      { name: "Bitcoin", posts: "46K" },
      { name: "Nostr", posts: "38K" },
      { name: "Sats", posts: "29K" },
      { name: "Lightning", posts: "21K" },
      { name: "BTC", posts: "16K" },
    ]
  };

  const mostLikedTopics = {
    all: [
      { name: "Nostr", posts: "42K" },
      { name: "Bitcoin", posts: "38K" },
      { name: "AI", posts: "25K" },
      { name: "Web5", posts: "19K" },
      { name: "Tech", posts: "12K" },
    ],
    "24h": [
      { name: "Nostr", posts: "8K" },
      { name: "Bitcoin", posts: "7K" },
      { name: "AI", posts: "5K" },
      { name: "Tech", posts: "3K" },
      { name: "Privacy", posts: "2K" },
    ],
    "7d": [
      { name: "Nostr", posts: "24K" },
      { name: "Bitcoin", posts: "21K" },
      { name: "AI", posts: "16K" },
      { name: "Web5", posts: "12K" },
      { name: "Tech", posts: "9K" },
    ]
  };
  
  // Get the appropriate topics based on the active filter and time range
  const getTrendingTopics = () => {
    switch (activeFilter) {
      case "popular":
        if (timeRange === "24h") return last24HTrendingTopics;
        if (timeRange === "7d") return last7DTrendingTopics;
        return allTimeTrendingTopics;
      case "zapped":
        return mostZappedTopics[timeRange];
      case "liked":
        return mostLikedTopics[timeRange];
      default:
        return allTimeTrendingTopics;
    }
  };
  
  const trendingTopics = getTrendingTopics();
  
  const handleTopicClick = (topic: string) => {
    if (onTopicClick) {
      onTopicClick(topic);
      setIsFilterOpen(false);
    }
  };

  // Find the current filter option
  const currentFilter = filterOptions.find(option => option.value === activeFilter);
  // Find the current time option
  const currentTime = timeOptions.find(option => option.value === timeRange);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Trending</CardTitle>
          
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:inline-block">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Category
              </div>
              {filterOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    option.value === activeFilter && "bg-accent"
                  )}
                >
                  {option.icon}
                  {option.label}
                  {option.value === activeFilter && (
                    <div className="ml-auto w-4 h-4 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <div className="px-2 py-1.5 text-sm font-semibold">
                Time Range
              </div>
              {timeOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    option.value === timeRange && "bg-accent"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  {option.label}
                  {option.value === timeRange && (
                    <div className="ml-auto w-4 h-4 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1 bg-background">
          {currentFilter?.icon}
          <span>{currentFilter?.label}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 bg-background">
          <Clock className="h-3 w-3" />
          <span>{currentTime?.label}</span>
        </Badge>
      </div>
      
      <CardContent className="px-4 pb-3">
        <div className="space-y-4">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic) => (
              <div 
                key={topic.name} 
                className="hover:bg-accent/50 px-2 py-1.5 rounded-md -mx-2 cursor-pointer transition-colors"
                onClick={() => handleTopicClick(topic.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-md">#{topic.name}</div>
                  <div className="text-sm text-muted-foreground">{topic.posts}</div>
                </div>
                <div className="text-xs text-muted-foreground">posts</div>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-muted-foreground">
              No topics found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingSection;

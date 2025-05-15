
import { useState } from "react";
import { TrendingUp, Zap, Heart } from "lucide-react";
import { FilterOption, FilterType, TimeOption, TimeRange, Topic } from "../types";

export const useTrendingTopicsData = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("popular");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const filterOptions: FilterOption[] = [
    { value: "popular", label: "Popular", icon: <TrendingUp className="h-4 w-4" /> },
    { value: "zapped", label: "Most Zapped", icon: <Zap className="h-4 w-4" /> },
    { value: "liked", label: "Most Liked", icon: <Heart className="h-4 w-4" /> }
  ];
  
  const timeOptions: TimeOption[] = [
    { value: "all", label: "All time" },
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" }
  ];
  
  // This would be fetched from Nostr in a real implementation
  const allTimeTrendingTopics = [
    { tag: "Bitcoin", count: 124000 },
    { tag: "Nostr", count: 87000 },
    { tag: "Lightning", count: 65000 },
    { tag: "Decentralization", count: 42000 },
    { tag: "Web5", count: 38000 },
  ];

  const last24HTrendingTopics = [
    { tag: "Bitcoin", count: 18000 },
    { tag: "AI", count: 15000 },
    { tag: "Nostr", count: 12000 },
    { tag: "OpenAI", count: 10000 },
    { tag: "Tech", count: 8000 },
  ];

  const last7DTrendingTopics = [
    { tag: "Bitcoin", count: 56000 },
    { tag: "Nostr", count: 43000 },
    { tag: "Lightning", count: 32000 },
    { tag: "Ethereum", count: 28000 },
    { tag: "Privacy", count: 21000 },
  ];

  const mostZappedTopics = {
    all: [
      { tag: "Bitcoin", count: 98000 },
      { tag: "Nostr", count: 76000 },
      { tag: "Sats", count: 54000 },
      { tag: "Lightning", count: 41000 },
      { tag: "BTC", count: 32000 },
    ],
    "24h": [
      { tag: "Bitcoin", count: 14000 },
      { tag: "Nostr", count: 11000 },
      { tag: "Lightning", count: 8000 },
      { tag: "Sats", count: 7000 },
      { tag: "Decentralization", count: 5000 },
    ],
    "7d": [
      { tag: "Bitcoin", count: 46000 },
      { tag: "Nostr", count: 38000 },
      { tag: "Sats", count: 29000 },
      { tag: "Lightning", count: 21000 },
      { tag: "BTC", count: 16000 },
    ]
  };

  const mostLikedTopics = {
    all: [
      { tag: "Nostr", count: 42000 },
      { tag: "Bitcoin", count: 38000 },
      { tag: "AI", count: 25000 },
      { tag: "Web5", count: 19000 },
      { tag: "Tech", count: 12000 },
    ],
    "24h": [
      { tag: "Nostr", count: 8000 },
      { tag: "Bitcoin", count: 7000 },
      { tag: "AI", count: 5000 },
      { tag: "Tech", count: 3000 },
      { tag: "Privacy", count: 2000 },
    ],
    "7d": [
      { tag: "Nostr", count: 24000 },
      { tag: "Bitcoin", count: 21000 },
      { tag: "AI", count: 16000 },
      { tag: "Web5", count: 12000 },
      { tag: "Tech", count: 9000 },
    ]
  };
  
  // Get the appropriate topics based on the active filter and time range
  const getTrendingTopics = (): Topic[] => {
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
  
  // Find the current filter option
  const currentFilter = filterOptions.find(option => option.value === activeFilter);
  // Find the current time option
  const currentTime = timeOptions.find(option => option.value === timeRange);

  return {
    activeFilter,
    setActiveFilter,
    timeRange,
    setTimeRange,
    isFilterOpen,
    setIsFilterOpen,
    filterOptions,
    timeOptions,
    trendingTopics,
    currentFilter,
    currentTime
  };
};


import { useState } from "react";
import { TrendingUp, ZapIcon, Heart } from "lucide-react";
import { FilterOption, FilterType, TimeOption, TimeRange, Topic } from "../types";

export const useTrendingTopicsData = () => {
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

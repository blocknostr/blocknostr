
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
  const allTimeTrendingTopics: Topic[] = [
    { name: "Bitcoin", posts: "124K", isHashtag: true },
    { name: "Nostr", posts: "87K", isHashtag: true },
    { name: "Lightning", posts: "65K", isHashtag: true },
    { name: "Decentralization", posts: "42K", isHashtag: false },
    { name: "Web5", posts: "38K", isHashtag: false },
  ];

  const last24HTrendingTopics: Topic[] = [
    { name: "Bitcoin", posts: "18K", isHashtag: true },
    { name: "AI", posts: "15K", isHashtag: true },
    { name: "Nostr", posts: "12K", isHashtag: true },
    { name: "OpenAI", posts: "10K", isHashtag: false },
    { name: "Tech", posts: "8K", isHashtag: true },
  ];

  const last7DTrendingTopics: Topic[] = [
    { name: "Bitcoin", posts: "56K", isHashtag: true },
    { name: "Nostr", posts: "43K", isHashtag: true },
    { name: "Lightning", posts: "32K", isHashtag: true },
    { name: "Ethereum", posts: "28K", isHashtag: true },
    { name: "Privacy", posts: "21K", isHashtag: true },
  ];

  const mostZappedTopics = {
    all: [
      { name: "Bitcoin", posts: "98K", isHashtag: true },
      { name: "Nostr", posts: "76K", isHashtag: true },
      { name: "Sats", posts: "54K", isHashtag: true },
      { name: "Lightning", posts: "41K", isHashtag: true },
      { name: "BTC", posts: "32K", isHashtag: true },
    ],
    "24h": [
      { name: "Bitcoin", posts: "14K", isHashtag: true },
      { name: "Nostr", posts: "11K", isHashtag: true },
      { name: "Lightning", posts: "8K", isHashtag: true },
      { name: "Sats", posts: "7K", isHashtag: true },
      { name: "Decentralization", posts: "5K", isHashtag: false },
    ],
    "7d": [
      { name: "Bitcoin", posts: "46K", isHashtag: true },
      { name: "Nostr", posts: "38K", isHashtag: true },
      { name: "Sats", posts: "29K", isHashtag: true },
      { name: "Lightning", posts: "21K", isHashtag: true },
      { name: "BTC", posts: "16K", isHashtag: true },
    ]
  };

  const mostLikedTopics = {
    all: [
      { name: "Nostr", posts: "42K", isHashtag: true },
      { name: "Bitcoin", posts: "38K", isHashtag: true },
      { name: "AI", posts: "25K", isHashtag: true },
      { name: "Web5", posts: "19K", isHashtag: false },
      { name: "Tech", posts: "12K", isHashtag: true },
    ],
    "24h": [
      { name: "Nostr", posts: "8K", isHashtag: true },
      { name: "Bitcoin", posts: "7K", isHashtag: true },
      { name: "AI", posts: "5K", isHashtag: true },
      { name: "Tech", posts: "3K", isHashtag: true },
      { name: "Privacy", posts: "2K", isHashtag: true },
    ],
    "7d": [
      { name: "Nostr", posts: "24K", isHashtag: true },
      { name: "Bitcoin", posts: "21K", isHashtag: true },
      { name: "AI", posts: "16K", isHashtag: true },
      { name: "Web5", posts: "12K", isHashtag: false },
      { name: "Tech", posts: "9K", isHashtag: true },
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
        return mostZappedTopics[timeRange as keyof typeof mostZappedTopics];
      case "liked":
        return mostLikedTopics[timeRange as keyof typeof mostLikedTopics];
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


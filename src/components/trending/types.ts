
import React from "react";

export type FilterType = "popular" | "zapped" | "liked";
export type TimeRange = "all" | "24h" | "7d";

export type FilterOption = {
  value: FilterType;
  label: string;
  icon: React.ReactNode;
};

export type TimeOption = {
  value: TimeRange;
  label: string;
};

export type Topic = {
  tag: string;
  count: number;
};

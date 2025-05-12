
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a timestamp as a relative time string (e.g., "5 minutes ago")
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  // Less than a minute
  if (diff < 60) {
    return "just now";
  }
  // Less than an hour
  else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes}m ago`;
  }
  // Less than a day
  else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}h ago`;
  }
  // Less than a week
  else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  }
  // Less than a month
  else if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800);
    return `${weeks}w ago`;
  }
  // Less than a year
  else if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months}mo ago`;
  }
  // A year or more
  else {
    const years = Math.floor(diff / 31536000);
    return `${years}y ago`;
  }
}


/// <reference types="vite/client" />

// Add any custom type definitions here if needed

// Define trending topic types
declare namespace Trending {
  type Topic = {
    tag: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
}


/**
 * LinxLabs API service for fetching Alephium dApps and projects
 * Uses the LinxLabs public API: https://api.linxlabs.org/docs/
 */

// Base API URL
const LINXLABS_API_BASE = "https://api.linxlabs.org/api";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Project type definition based on LinxLabs API
export interface LinxLabsProject {
  id: string;
  name: string;
  description: string;
  url: string;
  category?: string;
  logo?: string;
  githubUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  status?: 'production' | 'beta' | 'alpha' | string;
  tags?: string[];
}

// Response type from LinxLabs API
interface LinxLabsResponse {
  projects: LinxLabsProject[];
  total: number;
  page: number;
  pageSize: number;
}

// In-memory cache for API data
interface CachedData<T> {
  data: T;
  expiresAt: number;
}

// Cache for projects data
let cachedProjects: CachedData<LinxLabsProject[]> | null = null;

/**
 * Fetches all Alephium projects/dApps from LinxLabs API
 */
export const fetchAlephiumDApps = async (): Promise<LinxLabsProject[]> => {
  // Return cached data if still valid
  const currentTime = Date.now();
  if (cachedProjects && currentTime < cachedProjects.expiresAt) {
    console.log("Using cached LinxLabs projects data");
    return cachedProjects.data;
  }
  
  try {
    // Fetch data from LinxLabs API
    const response = await fetch(`${LINXLABS_API_BASE}/projects?blockchain=alephium`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LinxLabs data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as LinxLabsResponse;
    console.log("Fetched LinxLabs projects data:", data);
    
    // Cache the data
    cachedProjects = {
      data: data.projects || [],
      expiresAt: currentTime + CACHE_DURATION
    };
    
    return cachedProjects.data;
  } catch (error) {
    console.error("Error fetching LinxLabs projects:", error);
    // Return last cached data if available, otherwise return empty array
    return cachedProjects?.data || [];
  }
};

/**
 * Fetches projects by category
 */
export const fetchProjectsByCategory = async (category: string): Promise<LinxLabsProject[]> => {
  const allProjects = await fetchAlephiumDApps();
  return allProjects.filter(project => project.category === category);
};

/**
 * Fetches featured projects
 */
export const fetchFeaturedProjects = async (): Promise<LinxLabsProject[]> => {
  const allProjects = await fetchAlephiumDApps();
  // Filter for featured projects (in a real API this might be a dedicated endpoint)
  // Here we're just selecting the first 3 as an example
  return allProjects.slice(0, 3);
};

export default {
  fetchAlephiumDApps,
  fetchProjectsByCategory,
  fetchFeaturedProjects
};

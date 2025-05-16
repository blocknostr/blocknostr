
/**
 * DApps API service for fetching Alephium dApps and projects
 * Uses the alph.land website data: https://www.alph.land/
 */

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Project type definition
export interface DAppProject {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  logo?: string;
  githubUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  status: 'production' | 'beta' | 'alpha' | string;
  tags?: string[];
}

// In-memory cache for API data
interface CachedData<T> {
  data: T;
  expiresAt: number;
}

// Cache for projects data
let cachedProjects: CachedData<DAppProject[]> | null = null;

/**
 * Fetches all Alephium dApps from alph.land
 */
export const fetchAlephiumDApps = async (): Promise<DAppProject[]> => {
  // Return cached data if still valid
  const currentTime = Date.now();
  if (cachedProjects && currentTime < cachedProjects.expiresAt) {
    console.log("Using cached dApps data");
    return cachedProjects.data;
  }
  
  try {
    // Fetch data from alph.land API
    const response = await fetch('https://www.alph.land/api/dapps');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dApps data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Fetched alph.land dApps data:", data);
    
    // Format the data to match our interface
    const formattedData: DAppProject[] = data.dapps.map((dapp: any) => ({
      id: dapp.id || String(Math.random()),
      name: dapp.name,
      description: dapp.description || dapp.shortDescription || "Alephium dApp",
      url: dapp.url,
      category: dapp.category || "Other",
      logo: dapp.logo,
      githubUrl: dapp.githubUrl,
      twitterUrl: dapp.twitterUrl,
      discordUrl: dapp.discordUrl,
      status: dapp.status || "production",
      tags: dapp.tags
    }));
    
    // Cache the data
    cachedProjects = {
      data: formattedData,
      expiresAt: currentTime + CACHE_DURATION
    };
    
    return cachedProjects.data;
  } catch (error) {
    console.error("Error fetching dApps projects:", error);
    // Return last cached data if available, otherwise return empty array
    return cachedProjects?.data || [];
  }
};

/**
 * Fetches projects by category
 */
export const fetchProjectsByCategory = async (category: string): Promise<DAppProject[]> => {
  const allProjects = await fetchAlephiumDApps();
  return allProjects.filter(project => project.category === category);
};

/**
 * Fetches featured projects
 */
export const fetchFeaturedProjects = async (): Promise<DAppProject[]> => {
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

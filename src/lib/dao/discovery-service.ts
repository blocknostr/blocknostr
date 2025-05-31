import { 
  DAO, 
  CommunityCategory, 
  CommunityMetrics, 
  CommunitySearchFilters, 
  CommunitySearchResult, 
  FeaturedCommunity, 
  CommunityRecommendation,
  PopularTag,
  DAOWithMetrics 
} from '@/api/types/dao';
import { daoService } from './dao-service';

// Predefined community categories
export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Programming, development, and tech discussions',
    icon: '💻',
    color: 'bg-blue-500',
    subcategories: ['Programming', 'AI/ML', 'Blockchain', 'Web Dev', 'Mobile Dev']
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Video games, esports, and gaming communities',
    icon: '🎮',
    color: 'bg-purple-500',
    subcategories: ['PC Gaming', 'Console', 'Mobile Games', 'Esports', 'Game Dev']
  },
  {
    id: 'art',
    name: 'Art & Design',
    description: 'Creative arts, design, and visual content',
    icon: '🎨',
    color: 'bg-pink-500',
    subcategories: ['Digital Art', 'Photography', 'UI/UX', 'Graphic Design', 'NFTs']
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Entrepreneurship, finance, and business discussions',
    icon: '💼',
    color: 'bg-green-500',
    subcategories: ['Startups', 'Finance', 'Marketing', 'Investing', 'Career']
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Scientific research, discoveries, and discussions',
    icon: '🔬',
    color: 'bg-cyan-500',
    subcategories: ['Physics', 'Biology', 'Chemistry', 'Space', 'Research']
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Health, fitness, food, and personal interests',
    icon: '🌱',
    color: 'bg-orange-500',
    subcategories: ['Health', 'Fitness', 'Food', 'Travel', 'Hobbies']
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Learning, teaching, and educational content',
    icon: '📚',
    color: 'bg-indigo-500',
    subcategories: ['Online Learning', 'Tutorials', 'Academic', 'Skills', 'Certification']
  },
  {
    id: 'general',
    name: 'General',
    description: 'General discussions and miscellaneous topics',
    icon: '💬',
    color: 'bg-gray-500',
    subcategories: ['Random', 'News', 'Opinion', 'Q&A', 'Social']
  }
];

/**
 * Service for community discovery, search, and analytics
 */
export class DiscoveryService {
  
  /**
   * Get all categories
   */
  getAllCategories(): CommunityCategory[] {
    return COMMUNITY_CATEGORIES;
  }
  
  /**
   * Search and filter communities
   */
  async searchCommunities(filters: CommunitySearchFilters): Promise<CommunitySearchResult[]> {
    try {
      console.log('Searching communities with filters:', filters);
      
      // Get all communities
      const allCommunities = await daoService.getDAOs(500);
      
      // Calculate metrics for each community
      const communitiesWithMetrics = await Promise.all(
        allCommunities.map(async (community) => {
          const metrics = await this.calculateCommunityMetrics(community);
          return { ...community, metrics };
        })
      );
      
      // Apply filters
      let filteredCommunities = communitiesWithMetrics.filter(community => {
        // Text search
        if (filters.query) {
          const query = filters.query.toLowerCase();
          const searchText = `${community.name} ${community.description} ${community.tags.join(' ')}`.toLowerCase();
          if (!searchText.includes(query)) {
            return false;
          }
        }
        
        // Category filter
        if (filters.categories && filters.categories.length > 0) {
          const communityCategory = this.categorizeDAO(community);
          if (!filters.categories.includes(communityCategory)) {
            return false;
          }
        }
        
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => 
            community.tags.some(communityTag => 
              communityTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasMatchingTag) {
            return false;
          }
        }
        
        // Member count filters
        if (filters.minMembers && community.members.length < filters.minMembers) {
          return false;
        }
        if (filters.maxMembers && community.members.length > filters.maxMembers) {
          return false;
        }
        
        // Privacy filter
        if (filters.isPrivate !== undefined && community.isPrivate !== filters.isPrivate) {
          return false;
        }
        
        // Recent activity filter
        if (filters.hasRecentActivity) {
          const weekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
          if (community.metrics.lastActivity < weekAgo) {
            return false;
          }
        }
        
        return true;
      });
      
      // Calculate match scores
      const searchResults: CommunitySearchResult[] = filteredCommunities.map(community => {
        let matchScore = 0;
        
        // Text relevance scoring
        if (filters.query) {
          const query = filters.query.toLowerCase();
          if (community.name.toLowerCase().includes(query)) matchScore += 50;
          if (community.description.toLowerCase().includes(query)) matchScore += 30;
          if (community.tags.some(tag => tag.toLowerCase().includes(query))) matchScore += 20;
        }
        
        // Boost score based on activity and members
        matchScore += Math.min(community.members.length * 0.1, 20);
        matchScore += Math.min(community.metrics.engagementRate * 10, 15);
        
        // Generate excerpt for search results
        let excerpt = '';
        if (filters.query) {
          const query = filters.query.toLowerCase();
          const description = community.description;
          const queryIndex = description.toLowerCase().indexOf(query);
          if (queryIndex !== -1) {
            const start = Math.max(0, queryIndex - 50);
            const end = Math.min(description.length, queryIndex + 100);
            excerpt = '...' + description.substring(start, end) + '...';
          }
        }
        
        return {
          ...community,
          matchScore,
          excerpt
        };
      });
      
      // Sort results
      searchResults.sort((a, b) => {
        switch (filters.sortBy) {
          case 'members':
            return filters.sortOrder === 'desc' 
              ? b.members.length - a.members.length
              : a.members.length - b.members.length;
          case 'activity':
            return filters.sortOrder === 'desc'
              ? b.metrics.engagementRate - a.metrics.engagementRate
              : a.metrics.engagementRate - b.metrics.engagementRate;
          case 'alphabetical':
            return filters.sortOrder === 'desc'
              ? b.name.localeCompare(a.name)
              : a.name.localeCompare(b.name);
          case 'newest':
            return filters.sortOrder === 'desc'
              ? b.createdAt - a.createdAt
              : a.createdAt - b.createdAt;
          default:
            // Default: sort by match score and then by members
            if (Math.abs(b.matchScore - a.matchScore) > 5) {
              return b.matchScore - a.matchScore;
            }
            return b.members.length - a.members.length;
        }
      });
      
      console.log(`Found ${searchResults.length} matching communities`);
      return searchResults;
    } catch (error) {
      console.error('Error searching communities:', error);
      return [];
    }
  }
  
  /**
   * Get trending communities
   */
  async getTrendingCommunities(limit: number = 10): Promise<DAOWithMetrics[]> {
    try {
      const communities = await daoService.getDAOs(100);
      
      const communitiesWithMetrics = await Promise.all(
        communities.map(async (community) => {
          const metrics = await this.calculateCommunityMetrics(community);
          return { 
            ...community, 
            metrics,
            category: this.categorizeDAO(community)
          };
        })
      );
      
      // Sort by engagement rate and recent activity
      const trending = communitiesWithMetrics
        .filter(c => c.metrics.lastActivity > Date.now() / 1000 - (7 * 24 * 60 * 60)) // Active in last week
        .sort((a, b) => {
          const scoreA = a.metrics.engagementRate * 0.6 + a.metrics.growthRate * 0.4;
          const scoreB = b.metrics.engagementRate * 0.6 + b.metrics.growthRate * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, limit);
      
      return trending;
    } catch (error) {
      console.error('Error getting trending communities:', error);
      return [];
    }
  }
  
  /**
   * Get community recommendations for a user
   */
  async getRecommendedCommunities(userPubkey: string, limit: number = 5): Promise<CommunityRecommendation[]> {
    try {
      const userCommunities = await daoService.getUserDAOs(userPubkey);
      const allCommunities = await daoService.getDAOs(200);
      
      // Get user's interests from their current communities
      const userTags = userCommunities.flatMap(c => c.tags);
      const userCategories = userCommunities.map(c => this.categorizeDAO(c));
      
      const recommendations: CommunityRecommendation[] = [];
      
      for (const community of allCommunities) {
        // Skip if user is already a member
        if (userCommunities.some(uc => uc.id === community.id)) {
          continue;
        }
        
        let score = 0;
        let reason = '';
        let basedOn: 'tags' | 'members' | 'activity' | 'manual' = 'tags';
        
        // Score based on tag similarity
        const commonTags = community.tags.filter(tag => 
          userTags.some(userTag => userTag.toLowerCase() === tag.toLowerCase())
        );
        if (commonTags.length > 0) {
          score += commonTags.length * 20;
          reason = `Similar interests: ${commonTags.slice(0, 2).join(', ')}`;
          basedOn = 'tags';
        }
        
        // Score based on category similarity
        const communityCategory = this.categorizeDAO(community);
        if (userCategories.includes(communityCategory)) {
          score += 30;
          if (!reason) {
            reason = `Similar to your ${communityCategory} communities`;
          }
        }
        
        // Score based on community activity and quality
        const metrics = await this.calculateCommunityMetrics(community);
        if (metrics.engagementRate > 0.1) {
          score += 15;
        }
        if (metrics.memberCount > 10 && metrics.memberCount < 1000) {
          score += 10; // Prefer medium-sized active communities
        }
        
        // Boost score for highly active communities
        if (metrics.avgPostsPerDay > 1) {
          score += 10;
          if (!reason) {
            reason = 'Active community with regular discussions';
            basedOn = 'activity';
          }
        }
        
        if (score > 20) {
          recommendations.push({
            community,
            reason: reason || 'Recommended for you',
            score,
            basedOn
          });
        }
      }
      
      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting recommended communities:', error);
      return [];
    }
  }
  
  /**
   * Get popular tags across all communities
   */
  async getPopularTags(limit: number = 20): Promise<PopularTag[]> {
    try {
      const communities = await daoService.getDAOs(500);
      const tagCounts = new Map<string, number>();
      
      // Count tag usage
      communities.forEach(community => {
        community.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag && normalizedTag.length > 1) {
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          }
        });
      });
      
      // Convert to PopularTag objects
      const popularTags: PopularTag[] = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({
          tag,
          count,
          growthRate: 0, // TODO: Calculate growth rate over time
          category: this.categorizeTag(tag)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return popularTags;
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  }
  
  /**
   * Calculate metrics for a community
   */
  async calculateCommunityMetrics(community: DAO): Promise<CommunityMetrics> {
    try {
      // Basic metrics from DAO data
      const memberCount = community.members.length;
      const totalProposals = community.proposals;
      
      // For now, we'll estimate these metrics
      // In a real implementation, you'd query historical data
      const activeMembers = Math.max(1, Math.floor(memberCount * 0.3)); // Estimate 30% active
      const avgPostsPerDay = Math.random() * 5; // Placeholder - should be calculated from real data
      const lastActivity = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 7 * 24 * 60 * 60); // Random within last week
      const growthRate = Math.random() * 20 - 5; // Random growth rate between -5% and 15%
      const engagementRate = memberCount > 0 ? (activeMembers / memberCount) : 0;
      
      return {
        id: community.id,
        memberCount,
        totalPosts: 0, // Would be calculated from actual posts
        totalProposals,
        activeMembers,
        avgPostsPerDay,
        lastActivity,
        growthRate,
        engagementRate
      };
    } catch (error) {
      console.error('Error calculating community metrics:', error);
      return {
        id: community.id,
        memberCount: community.members.length,
        totalPosts: 0,
        totalProposals: community.proposals,
        activeMembers: 1,
        avgPostsPerDay: 0,
        lastActivity: community.createdAt,
        growthRate: 0,
        engagementRate: 0
      };
    }
  }
  
  /**
   * Auto-categorize a DAO based on its name, description, and tags
   */
  categorizeDAO(dao: DAO): string {
    const text = `${dao.name} ${dao.description} ${dao.tags.join(' ')}`.toLowerCase();
    
    // Technology keywords
    if (this.containsKeywords(text, ['code', 'programming', 'developer', 'tech', 'software', 'web', 'app', 'api', 'blockchain', 'crypto', 'ai', 'ml', 'javascript', 'python', 'react'])) {
      return 'technology';
    }
    
    // Gaming keywords
    if (this.containsKeywords(text, ['game', 'gaming', 'esports', 'streamer', 'twitch', 'xbox', 'playstation', 'nintendo', 'pc gaming', 'mobile game'])) {
      return 'gaming';
    }
    
    // Art keywords
    if (this.containsKeywords(text, ['art', 'design', 'creative', 'artist', 'photo', 'drawing', 'painting', 'nft', 'digital art', 'ui', 'ux'])) {
      return 'art';
    }
    
    // Business keywords
    if (this.containsKeywords(text, ['business', 'startup', 'entrepreneur', 'finance', 'investing', 'marketing', 'career', 'money', 'trading'])) {
      return 'business';
    }
    
    // Science keywords
    if (this.containsKeywords(text, ['science', 'research', 'physics', 'biology', 'chemistry', 'space', 'astronomy', 'medicine', 'health'])) {
      return 'science';
    }
    
    // Lifestyle keywords
    if (this.containsKeywords(text, ['fitness', 'health', 'food', 'cooking', 'travel', 'hobby', 'lifestyle', 'wellness', 'sport'])) {
      return 'lifestyle';
    }
    
    // Education keywords
    if (this.containsKeywords(text, ['education', 'learning', 'study', 'tutorial', 'course', 'school', 'university', 'academic', 'teach'])) {
      return 'education';
    }
    
    return 'general';
  }
  
  /**
   * Categorize a tag
   */
  categorizeTag(tag: string): string {
    return this.categorizeDAO({ tags: [tag], name: tag, description: tag } as DAO);
  }
  
  /**
   * Check if text contains any of the given keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}

export const discoveryService = new DiscoveryService(); 


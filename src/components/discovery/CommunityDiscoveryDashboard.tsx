import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Search, 
  Star, 
  Hash, 
  Grid3X3, 
  Filter,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  Activity,
  Clock,
  Calendar,
  MessageSquare
} from "lucide-react";
import { useDAOCommunities, useDAOSearch } from "@/hooks/api/useDAORedux";
import CommunitySearchBar from "./CommunitySearchBar";
import DAOCard from "@/components/dao/DAOCard";
import { CommunitySearchFilters } from "@/api/types/dao";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface CommunityDiscoveryDashboardProps {
  onCommunityJoin?: (communityId: string) => void;
  onCommunityPreview?: (communityId: string) => void;
}

const CommunityDiscoveryDashboard: React.FC<CommunityDiscoveryDashboardProps> = ({
  onCommunityJoin,
  onCommunityPreview
}) => {
  const [activeTab, setActiveTab] = useState("search");
  const [userCommunityIds, setUserCommunityIds] = useState<Set<string>>(new Set());
  
  const {
    searchResults,
    trendingCommunities,
    recommendedCommunities,
    popularTags,
    searchFilters,
    categories,
    loading,
    searchLoading,
    trendingLoading,
    recommendationsLoading,
    tagsLoading,
    searchCommunities,
    quickSearch,
    searchByCategory,
    searchByTag,
    clearSearch,
    fetchTrendingCommunities,
    fetchRecommendedCommunities,
    currentUserPubkey,
    hasUser,
    getDiscoveryStats
  } = useDAOSearch();
  
  // Redux hooks for DAO data
  const { daos: myDaos } = useDAOCommunities({ limit: 50, enabled: true });
  
  // Placeholder join function (to be implemented in Redux)
  const joinDAO = async (communityId: string) => {
    console.log('Join DAO functionality to be implemented in Redux');
    return false;
  };
  
  // Update user communities when myDaos changes
  useEffect(() => {
    if (myDaos) {
      setUserCommunityIds(new Set(myDaos.map(dao => dao.id)));
    }
  }, [myDaos]);
  
  const handleCommunityJoin = async (communityId: string) => {
    try {
      const success = await joinDAO(communityId);
      if (success) {
        setUserCommunityIds(prev => new Set([...prev, communityId]));
        if (onCommunityJoin) {
          onCommunityJoin(communityId);
        }
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community');
    }
  };
  
  const handleCategoryClick = (categoryId: string) => {
    searchByCategory(categoryId);
    setActiveTab("search");
  };
  
  const handleTagClick = (tag: string) => {
    searchByTag(tag);
    setActiveTab("search");
  };
  
  const handleSearchSubmit = (filters: CommunitySearchFilters) => {
    searchCommunities(filters);
    setActiveTab("search");
  };
  
  const stats = getDiscoveryStats();
  
  const hasSearchResults = searchResults.length > 0;
  const hasActiveSearch = !!(searchFilters.query || 
    searchFilters.categories?.length || 
    searchFilters.tags?.length ||
    searchFilters.minMembers ||
    searchFilters.maxMembers ||
    searchFilters.isPrivate !== undefined ||
    searchFilters.hasRecentActivity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Communities</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find and join communities that match your interests. Explore trending topics, 
          get personalized recommendations, and connect with like-minded people.
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="max-w-4xl mx-auto">
        <CommunitySearchBar
          onSearch={handleSearchSubmit}
          onQuickSearch={quickSearch}
          onCategoryFilter={handleCategoryClick}
          onTagFilter={handleTagClick}
          onClearSearch={clearSearch}
          categories={categories}
          popularTags={popularTags.map(tag => tag.tag)}
          filters={searchFilters}
          isLoading={searchLoading}
        />
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search {hasSearchResults && `(${searchResults.length})`}
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending {trendingCommunities.length > 0 && `(${trendingCommunities.length})`}
          </TabsTrigger>
          {hasUser && (
            <TabsTrigger value="recommended" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              For You {recommendedCommunities.length > 0 && `(${recommendedCommunities.length})`}
            </TabsTrigger>
          )}
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Explore
          </TabsTrigger>
        </TabsList>
        
        {/* Search Results Tab */}
        <TabsContent value="search" className="space-y-6">
          {hasActiveSearch ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Search Results {hasSearchResults && `(${searchResults.length})`}
                </h2>
                {hasSearchResults && (
                  <Button variant="outline" onClick={clearSearch}>
                    Clear Search
                  </Button>
                )}
              </div>
              
              {searchLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="w-3/4 h-4 bg-muted rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="w-full h-3 bg-muted rounded" />
                          <div className="w-2/3 h-3 bg-muted rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : hasSearchResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((community) => (
                    <DAOCard
                      key={community.id}
                      dao={community.community || community}
                      currentUserPubkey={currentUserPubkey}
                      onJoinDAO={(communityId) => handleCommunityJoin(communityId)}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No communities found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search filters or explore trending communities.
                    </p>
                    <Button onClick={() => setActiveTab("trending")}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Trending Communities
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Your Search</h3>
                <p className="text-muted-foreground">
                  Use the search bar above to find communities that interest you.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Communities
            </h2>
            <Button variant="outline" onClick={() => fetchTrendingCommunities()}>
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {trendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-3/4 h-4 bg-muted rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-muted rounded" />
                      <div className="w-2/3 h-3 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : trendingCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingCommunities.map((community) => (
                <DAOCard
                  key={community.id}
                  dao={community.community || community}
                  currentUserPubkey={currentUserPubkey}
                  onJoinDAO={(communityId) => handleCommunityJoin(communityId)}
                  variant="trending"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trending communities</h3>
                <p className="text-muted-foreground">
                  Check back later for trending communities.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Recommendations Tab */}
        {hasUser && (
          <TabsContent value="recommended" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Recommended For You
              </h2>
              <Button variant="outline" onClick={() => fetchRecommendedCommunities()}>
                <Target className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {recommendationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="w-3/4 h-4 bg-muted rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="w-full h-3 bg-muted rounded" />
                        <div className="w-2/3 h-3 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendedCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedCommunities.map((recommendation) => (
                  <DAOCard
                    key={recommendation.community.id}
                    dao={recommendation.community}
                    currentUserPubkey={currentUserPubkey}
                    onJoinDAO={(communityId) => handleCommunityJoin(communityId)}
                    variant="default"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Join some communities to get personalized recommendations.
                  </p>
                  <Button onClick={() => setActiveTab("explore")}>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Explore Categories
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
        
        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Explore by Category
          </h2>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {category.description}
                  </p>
                  <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2 mt-8">
                <Hash className="h-5 w-5" />
                Popular Tags
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 20).map((tag) => (
                  <Badge
                    key={tag.tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleTagClick(tag.tag)}
                  >
                    #{tag.tag} ({tag.count})
                  </Badge>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityDiscoveryDashboard; 


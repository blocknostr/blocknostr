import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Grid3X3, 
  TrendingUp,
  Hash
} from "lucide-react";
import { CommunitySearchFilters, CommunityCategory } from "@/api/types/dao";

interface CommunitySearchBarProps {
  onSearch: (filters: CommunitySearchFilters) => void;
  onQuickSearch: (query: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onTagFilter: (tag: string) => void;
  onClearSearch: () => void;
  categories: CommunityCategory[];
  popularTags: string[];
  filters: CommunitySearchFilters;
  isLoading?: boolean;
}

const CommunitySearchBar: React.FC<CommunitySearchBarProps> = ({
  onSearch,
  onQuickSearch,
  onCategoryFilter,
  onTagFilter,
  onClearSearch,
  categories,
  popularTags,
  filters,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [advancedFilters, setAdvancedFilters] = useState<CommunitySearchFilters>(filters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [memberRange, setMemberRange] = useState([
    filters.minMembers || 0, 
    filters.maxMembers || 1000
  ]);

  // Update local state when filters prop changes
  useEffect(() => {
    setSearchQuery(filters.query || '');
    setAdvancedFilters(filters);
    setMemberRange([
      filters.minMembers || 0, 
      filters.maxMembers || 1000
    ]);
  }, [filters]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(searchQuery);
  };

  const handleAdvancedSearch = () => {
    const searchFilters: CommunitySearchFilters = {
      ...advancedFilters,
      query: searchQuery,
      minMembers: memberRange[0] > 0 ? memberRange[0] : undefined,
      maxMembers: memberRange[1] < 1000 ? memberRange[1] : undefined
    };
    
    onSearch(searchFilters);
    setIsAdvancedOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setAdvancedFilters({
      query: '',
      sortBy: 'members',
      sortOrder: 'desc'
    });
    setMemberRange([0, 1000]);
    onClearSearch();
  };

  const hasActiveFilters = () => {
    return !!(
      filters.query ||
      filters.categories?.length ||
      filters.tags?.length ||
      filters.minMembers ||
      filters.maxMembers ||
      filters.isPrivate !== undefined ||
      filters.hasRecentActivity
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.minMembers) count++;
    if (filters.maxMembers) count++;
    if (filters.isPrivate !== undefined) count++;
    if (filters.hasRecentActivity) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Quick Search Bar */}
      <form onSubmit={handleQuickSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button type="submit" disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        
        {/* Advanced Filters Button */}
        <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Search Filters</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={advancedFilters.categories?.includes(category.id) || false}
                        onCheckedChange={(checked) => {
                          const currentCategories = advancedFilters.categories || [];
                          const newCategories = checked
                            ? [...currentCategories, category.id]
                            : currentCategories.filter(c => c !== category.id);
                          setAdvancedFilters({
                            ...advancedFilters,
                            categories: newCategories.length > 0 ? newCategories : undefined
                          });
                        }}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.icon} {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Popular Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.slice(0, 12).map((tag) => (
                      <Badge
                        key={tag}
                        variant={advancedFilters.tags?.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTags = advancedFilters.tags || [];
                          const newTags = currentTags.includes(tag)
                            ? currentTags.filter(t => t !== tag)
                            : [...currentTags, tag];
                          setAdvancedFilters({
                            ...advancedFilters,
                            tags: newTags.length > 0 ? newTags : undefined
                          });
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Member Count Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Member Count: {memberRange[0]} - {memberRange[1] >= 1000 ? '1000+' : memberRange[1]}
                </Label>
                <Slider
                  value={memberRange}
                  onValueChange={setMemberRange}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>
              
              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                  <Select
                    value={advancedFilters.sortBy || 'members'}
                    onValueChange={(value: any) => setAdvancedFilters({
                      ...advancedFilters,
                      sortBy: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="members">Member Count</SelectItem>
                      <SelectItem value="activity">Activity Level</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Order</Label>
                  <Select
                    value={advancedFilters.sortOrder || 'desc'}
                    onValueChange={(value: any) => setAdvancedFilters({
                      ...advancedFilters,
                      sortOrder: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">High to Low</SelectItem>
                      <SelectItem value="asc">Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Additional Filters */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recent-activity"
                    checked={advancedFilters.hasRecentActivity || false}
                    onCheckedChange={(checked) => setAdvancedFilters({
                      ...advancedFilters,
                      hasRecentActivity: checked || undefined
                    })}
                  />
                  <Label htmlFor="recent-activity" className="text-sm">
                    Active in last 7 days
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="public-only"
                    checked={advancedFilters.isPrivate === false}
                    onCheckedChange={(checked) => setAdvancedFilters({
                      ...advancedFilters,
                      isPrivate: checked ? false : undefined
                    })}
                  />
                  <Label htmlFor="public-only" className="text-sm">
                    Public communities only
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
              <Button onClick={handleAdvancedSearch}>
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {hasActiveFilters() && (
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </form>
      
      {/* Category Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 6).map((category) => (
          <Button
            key={category.id}
            variant={filters.categories?.includes(category.id) ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryFilter(category.id)}
            className="text-xs"
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>
      
      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.query && (
            <Badge variant="secondary">
              Search: "{filters.query}"
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onQuickSearch('')}
              />
            </Badge>
          )}
          
          {filters.categories?.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <Badge key={categoryId} variant="secondary">
                {category.icon} {category.name}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => {
                    const newCategories = filters.categories?.filter(c => c !== categoryId);
                    onSearch({
                      ...filters,
                      categories: newCategories?.length ? newCategories : undefined
                    });
                  }}
                />
              </Badge>
            ) : null;
          })}
          
          {filters.tags?.map(tag => (
            <Badge key={tag} variant="secondary">
              #{tag}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => {
                  const newTags = filters.tags?.filter(t => t !== tag);
                  onSearch({
                    ...filters,
                    tags: newTags?.length ? newTags : undefined
                  });
                }}
              />
            </Badge>
          ))}
          
          {(filters.minMembers || filters.maxMembers) && (
            <Badge variant="secondary">
              Members: {filters.minMembers || 0}-{filters.maxMembers || '∞'}
            </Badge>
          )}
          
          {filters.hasRecentActivity && (
            <Badge variant="secondary">Recently Active</Badge>
          )}
          
          {filters.isPrivate === false && (
            <Badge variant="secondary">Public Only</Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunitySearchBar; 


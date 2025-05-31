/**
 * TokenList - Performance-optimized token list component
 * Uses the new data manager > adapter > hook > component architecture
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, RefreshCw, Database, Zap, CheckCircle, AlertCircle, Search, Filter, BarChart3 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { useTokenList } from "@/hooks/business/useTokenList";
import { EnrichedToken } from "@/api/external/alephiumApi";

// Types
interface TokenListProps {
  address: string | null;
  showLPTokens?: boolean;
  enableVirtualization?: boolean;
  maxHeight?: number;
  enableFilters?: boolean;
  enableAutoRefresh?: boolean;
  className?: string;
}

interface VirtualizedListProps {
  tokens: EnrichedToken[];
  virtualization: {
    totalItems: number;
    startIndex: number;
    endIndex: number;
    containerHeight: number;
    scrollOffset: number;
  };
  onScroll: (offset: number) => void;
  itemHeight: number;
}

// Performance monitoring component
const PerformanceIndicator = memo<{ performanceInfo: any }>((({ performanceInfo }) => {
  const { totalTokens, filteredCount, renderCount, lastFilterTime, cacheHitRate } = performanceInfo;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`ml-2 ${cacheHitRate > 80 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            {renderCount} items
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div>Total: {totalTokens} | Filtered: {filteredCount} | Rendered: {renderCount}</div>
            <div>Filter time: {lastFilterTime}ms | Cache hit: {cacheHitRate.toFixed(1)}%</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}));

PerformanceIndicator.displayName = 'PerformanceIndicator';

// Memoized token row component
const TokenRow = memo<{ 
  token: EnrichedToken; 
  style?: React.CSSProperties;
  isVirtualized?: boolean;
}>(({ token, style, isVirtualized }) => {
  const tokenAmount = useMemo(() => {
    return Number(token.amount || "0") / (10 ** token.decimals);
  }, [token.amount, token.decimals]);

  const displayValue = useMemo(() => {
    if (token.usdValue && token.usdValue > 0) {
      return formatCurrency(token.usdValue);
    }
    return '$0.00';
  }, [token.usdValue]);

  const priceDisplay = useMemo(() => {
    if (token.tokenPrice && token.tokenPrice > 0) {
      return formatCurrency(token.tokenPrice);
    }
    return '$0.00';
  }, [token.tokenPrice]);

  const getPriceSourceBadge = useCallback(() => {
    if (!token.priceSource || token.priceSource === 'estimate') {
      return null;
    }
    
    const variant = token.priceSource === 'market' ? 'default' : 'secondary';
    const icon = token.priceSource === 'market' ? CheckCircle : AlertCircle;
    const IconComponent = icon;
    
    return (
      <Badge variant={variant} className="ml-2 text-xs">
        <IconComponent className="w-3 h-3 mr-1" />
        {token.priceSource}
      </Badge>
    );
  }, [token.priceSource]);

  const rowContent = (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-3">
        {token.logoURI && (
          <img 
            src={token.logoURI} 
            alt={token.symbol} 
            className="w-8 h-8 rounded-full"
            loading="lazy"
          />
        )}
        <div>
          <div className="flex items-center">
            <span className="font-medium">{token.symbol}</span>
            {token.isLPToken && (
              <Badge variant="outline" className="ml-2 text-xs">
                LP
              </Badge>
            )}
            {getPriceSourceBadge()}
          </div>
          <div className="text-sm text-gray-500 truncate max-w-40">
            {token.name}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-medium">{formatNumber(tokenAmount)}</div>
        <div className="text-sm text-gray-500">{displayValue}</div>
      </div>
      
      <div className="text-right">
        <div className="font-medium">{priceDisplay}</div>
      </div>
    </div>
  );

  if (isVirtualized && style) {
    return (
      <div style={style}>
        {rowContent}
      </div>
    );
  }

  return rowContent;
});

TokenRow.displayName = 'TokenRow';

// Virtualized list component
const VirtualizedList = memo<VirtualizedListProps>(({ 
  tokens, 
  virtualization, 
  onScroll, 
  itemHeight 
}) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    onScroll(scrollTop);
  }, [onScroll]);

  const totalHeight = virtualization.totalItems * itemHeight;
  const offsetY = virtualization.startIndex * itemHeight;

  return (
    <div 
      ref={scrollElementRef}
      className="overflow-auto"
      style={{ height: virtualization.containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {tokens.map((token, index) => (
            <TokenRow
              key={token.id}
              token={token}
              isVirtualized={true}
              style={{ height: itemHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Filter controls component
const FilterControls = memo<{
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  tokenSummary: any;
}>(({ filters, onFilterChange, onReset, tokenSummary }) => {
  return (
    <div className="space-y-4 p-4 border-b bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tokens..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Category */}
        <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tokens</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="lp">LP Tokens</SelectItem>
            <SelectItem value="nft">NFTs</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={(value) => onFilterChange('sortBy', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Value</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="alphabetical">Name</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort Order */}
        <Select value={filters.sortOrder} onValueChange={(value) => onFilterChange('sortOrder', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">High to Low</SelectItem>
            <SelectItem value="asc">Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {tokenSummary && (
        <div className="flex space-x-4 text-sm text-gray-600">
          <span>Total: {tokenSummary.totalTokens}</span>
          <span>Verified: {tokenSummary.categories.verified}</span>
          <span>LP: {tokenSummary.categories.lp}</span>
          <span>NFTs: {tokenSummary.categories.nft}</span>
        </div>
      )}
    </div>
  );
});

FilterControls.displayName = 'FilterControls';

// Main TokenList component
const TokenList: React.FC<TokenListProps> = memo(({
  address,
  showLPTokens = false,
  enableVirtualization = true,
  maxHeight = 600,
  enableFilters = true,
  enableAutoRefresh = true,
  className = ""
}) => {
  // FIXED: Memoize the options object to prevent unnecessary re-renders
  const tokenListOptions = useMemo(() => ({
    enableVirtualization,
    virtualizationConfig: {
      enabled: enableVirtualization,
      itemHeight: 80,
      overscan: 5,
      containerHeight: maxHeight
    },
    enableAutoUpdate: enableAutoRefresh,
    updateInterval: 30000
  }), [enableVirtualization, maxHeight, enableAutoRefresh]);

  // Use the performance-optimized hook
  const {
    filteredTokens,
    visibleTokens,
    tokenSummary,
    isLoading,
    error,
    filters,
    updateFilter,
    resetFilters,
    virtualization,
    setScrollOffset,
    refresh,
    clearCache,
    performanceInfo
  } = useTokenList(address, tokenListOptions);

  // Memoized filter change handler
  const handleFilterChange = useCallback((key: string, value: any) => {
    updateFilter(key as any, value);
  }, [updateFilter]);

  // Memoized refresh handler
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Memoized clear cache handler
  const handleClearCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  // Filter tokens by type if needed
  const displayTokens = useMemo(() => {
    if (showLPTokens !== undefined) {
      return enableVirtualization ? visibleTokens.filter(t => showLPTokens ? t.isLPToken : !t.isLPToken) : 
                                   filteredTokens.filter(t => showLPTokens ? t.isLPToken : !t.isLPToken);
    }
    return enableVirtualization ? visibleTokens : filteredTokens;
  }, [visibleTokens, filteredTokens, showLPTokens, enableVirtualization]);

  // Loading state
  if (isLoading && filteredTokens.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tokens</CardTitle>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
            </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Tokens</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle>
              {showLPTokens ? 'LP Tokens' : 'Tokens'}
            </CardTitle>
            <PerformanceIndicator performanceInfo={performanceInfo} />
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh token data</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleClearCache}>
                    <Database className="w-4 h-4" />
            </Button>
                </TooltipTrigger>
                <TooltipContent>Clear cache</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {tokenSummary && (
          <CardDescription>
            {displayTokens.length} of {tokenSummary.totalTokens} tokens
            {tokenSummary.totalValueUSD > 0 && (
              <span> • Total value: {formatCurrency(tokenSummary.totalValueUSD)}</span>
            )}
          </CardDescription>
        )}
      </CardHeader>

      {enableFilters && (
        <FilterControls
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          tokenSummary={tokenSummary}
        />
      )}

      <CardContent className="p-0">
        {displayTokens.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2" />
            <p>No tokens found</p>
            {filters.searchTerm && (
              <p className="text-sm">Try adjusting your search or filters</p>
                            )}
                          </div>
        ) : enableVirtualization ? (
          <VirtualizedList
            tokens={displayTokens}
            virtualization={virtualization}
            onScroll={setScrollOffset}
            itemHeight={80}
          />
        ) : (
          <div style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {displayTokens.map(token => (
              <TokenRow key={token.id} token={token} />
                                          ))}
                                        </div>
        )}
      </CardContent>
    </Card>
  );
});

TokenList.displayName = 'TokenList';

export default TokenList;


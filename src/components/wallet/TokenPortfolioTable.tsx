import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { EnrichedTokenWithWallets } from "@/api/types/wallet";
import { TrendingUp, AlertCircle, CheckCircle, ChevronUp, ChevronDown, Coins } from "lucide-react";

interface TokenPortfolioTableProps {
  tokens: EnrichedTokenWithWallets[];
  alphPrice: number;
  isLoading?: boolean;
  className?: string;
}

type SortField = 'symbol' | 'quantity' | 'alphValue' | 'usdValue';
type SortOrder = 'asc' | 'desc';

const TokenPortfolioTable: React.FC<TokenPortfolioTableProps> = ({ 
  tokens, 
  alphPrice, 
  isLoading = false,
  className = "" 
}) => {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('usdValue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort tokens
  const regularTokens = useMemo(() => {
    const filtered = tokens.filter(token => !token.isNFT);
    
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'symbol':
          aValue = a.symbol || '';
          bValue = b.symbol || '';
          break;
        case 'quantity':
          aValue = Number(a.amount || "0") / (10 ** a.decimals);
          bValue = Number(b.amount || "0") / (10 ** b.decimals);
          break;
        case 'alphValue':
          // Protect against division by zero or invalid alphPrice
          aValue = alphPrice > 0 ? (a.usdValue || 0) / alphPrice : 0;
          bValue = alphPrice > 0 ? (b.usdValue || 0) / alphPrice : 0;
          break;
        case 'usdValue':
        default:
          aValue = a.usdValue || 0;
          bValue = b.usdValue || 0;
          break;
      }
      
      if (sortField === 'symbol') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [tokens, sortField, sortOrder, alphPrice]);

  // Calculate totals and portfolio percentages
  const totals = useMemo(() => {
    const totalUSD = regularTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    // Protect against division by zero
    const totalALPH = alphPrice > 0 ? totalUSD / alphPrice : 0;
    
    return {
      totalUSD,
      totalALPH,
      tokenCount: regularTokens.length
    };
  }, [regularTokens, alphPrice]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-3 w-3 ml-1" /> : 
      <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const getPortfolioPercentage = (tokenValue: number) => {
    if (totals.totalUSD === 0) return 0;
    return (tokenValue / totals.totalUSD) * 100;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded-md bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="relative">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <Skeleton className="h-3 w-3 rounded-full" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-24" />
                </div>
                <div className="space-y-1 text-right min-w-[60px]">
                  <Skeleton className="h-3 w-12 ml-auto" />
                  <Skeleton className="h-2 w-8 ml-auto" />
                </div>
                <div className="space-y-1 text-right min-w-[60px]">
                  <Skeleton className="h-3 w-16 ml-auto" />
                  <Skeleton className="h-2 w-12 ml-auto" />
                </div>
                <div className="space-y-1 text-right min-w-[80px]">
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-2 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (regularTokens.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="text-center py-6">
            <div className="relative mb-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary/60" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No Tokens Found</h3>
            <p className="text-xs text-muted-foreground mb-3 max-w-sm mx-auto">
              Your token portfolio will appear here once you have token holdings.
            </p>
            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></div>
              <span>Waiting for token data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        {/* Compact Table Header */}
        <div className="grid grid-cols-12 gap-3 pb-2 mb-2 border-b border-border/50">
          <div 
            className="col-span-4 flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => handleSort('symbol')}
          >
            <span>Token</span>
            {getSortIcon('symbol')}
          </div>
          <div 
            className="col-span-3 text-right flex items-center justify-end text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => handleSort('quantity')}
          >
            <span>Quantity</span>
            {getSortIcon('quantity')}
          </div>
          <div 
            className="col-span-2 text-right flex items-center justify-end text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => handleSort('alphValue')}
          >
            <span>ALPH Value</span>
            {getSortIcon('alphValue')}
          </div>
          <div 
            className="col-span-3 text-right flex items-center justify-end text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => handleSort('usdValue')}
          >
            <span>USD Value</span>
            {getSortIcon('usdValue')}
          </div>
        </div>
        
        {/* Compact Token Rows */}
        <div className="space-y-1">
          {regularTokens.map((token) => {
            const quantity = Number(token.amount || "0") / (10 ** token.decimals);
            // Protect against division by zero
            const alphValue = alphPrice > 0 ? (token.usdValue || 0) / alphPrice : 0;
            const pricePerToken = token.tokenPrice || 0;
            const portfolioPercentage = getPortfolioPercentage(token.usdValue || 0);
            const isSelected = selectedRow === token.id;
            
            return (
              <div 
                key={token.id}
                className={`
                  grid grid-cols-12 gap-3 p-2 rounded-md border transition-all duration-200 cursor-pointer group
                  ${isSelected
                    ? 'border-primary/40 bg-gradient-to-r from-primary/5 to-background'
                    : 'border-border/30 hover:border-border/60 hover:bg-muted/20'
                  }
                `}
                onClick={() => setSelectedRow(selectedRow === token.id ? null : token.id)}
              >
                {/* Compact Token Column */}
                <div className="col-span-4 flex items-center space-x-2">
                  <div className="relative">
                    {token.logoURI ? (
                      <div className="relative">
                        <img 
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full border border-border/20"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="hidden w-8 h-8 rounded-full border border-border/20 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 items-center justify-center text-xs font-bold text-primary"
                        >
                          {token.symbol?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-border/20 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {token.symbol?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                    )}
                    
                    {/* Compact verification badge */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {token.priceSource === 'market' ? (
                        <div className="w-3 h-3 rounded-full bg-green-500 border border-background flex items-center justify-center">
                          <CheckCircle className="h-2 w-2 text-white" />
                        </div>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-yellow-500 border border-background flex items-center justify-center">
                          <AlertCircle className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {token.symbol}
                      </div>
                      <Badge 
                        variant={token.priceSource === 'market' ? 'default' : 'secondary'}
                        className="text-[10px] px-1 py-0 h-4"
                      >
                        {token.priceSource === 'market' ? 'V' : 'E'}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {token.name || token.id}
                    </div>
                  </div>
                </div>
                
                {/* Compact Quantity Column */}
                <div className="col-span-3 text-right">
                  <div className="font-semibold text-sm text-foreground">
                    {formatNumber(quantity)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {token.symbol}
                  </div>
                </div>
                
                {/* Compact ALPH Value Column */}
                <div className="col-span-2 text-right">
                  <div className="font-semibold text-sm text-blue-600">
                    {formatNumber(alphValue)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ALPH
                  </div>
                </div>
                
                {/* Compact USD Value Column */}
                <div className="col-span-3 text-right">
                  <div className={`font-semibold text-sm ${
                    (token.usdValue || 0) > 100 ? 'text-green-600' :
                    (token.usdValue || 0) > 10 ? 'text-blue-600' : 'text-muted-foreground'
                  }`}>
                    {formatCurrency(token.usdValue || 0)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {pricePerToken > 0 ? `@ ${formatCurrency(pricePerToken)}` : 'Est.'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenPortfolioTable; 


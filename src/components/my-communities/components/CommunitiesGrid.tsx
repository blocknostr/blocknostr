import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users,
  Search,
  Plus
} from "lucide-react";
import DAOCard from "@/components/dao/DAOCard";
import CommunitiesLoading from "./CommunitiesLoading";
import { DAO } from "@/api/types/dao";

interface CommunitiesGridProps {
  communities: DAO[];
  currentUserPubkey: string;
  onJoinCommunity?: (communityId: string, communityName: string) => void;
  loading?: boolean;
  variant?: 'default' | 'trending' | 'featured';
  title?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onCreateAction?: () => void;
  itemsPerPage?: number;
  showPagination?: boolean;
}

const ITEMS_PER_PAGE = 9; // 3x3 grid

const CommunitiesGrid: React.FC<CommunitiesGridProps> = ({
  communities,
  currentUserPubkey,
  onJoinCommunity,
  loading = false,
  variant = 'default',
  title,
  emptyMessage = "No communities found",
  emptyActionLabel = "Create Community",
  onEmptyAction,
  onCreateAction,
  itemsPerPage,
  showPagination = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const effectiveItemsPerPage = itemsPerPage || ITEMS_PER_PAGE;
  const totalPages = Math.ceil(communities.length / effectiveItemsPerPage);
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const endIndex = startIndex + effectiveItemsPerPage;
  const currentCommunities = communities.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Reset to page 1 when communities change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [communities.length]);

  if (loading) {
    return (
      <div className={variant === 'trending' ? "space-y-3" : "space-y-4"}>
        {title && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
        )}
        
        <CommunitiesLoading 
          variant="grid" 
          count={effectiveItemsPerPage}
          message="Loading communities..."
        />
        
        <div className="flex justify-center">
          <CommunitiesLoading variant="inline" message="Preparing pagination..." />
        </div>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className={variant === 'trending' ? "space-y-3" : "space-y-4"}>
        {title && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
        )}
        
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold mb-2">{emptyMessage}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {variant === 'trending' 
                ? "Check back later for trending communities."
                : "Be the first to create a community!"
              }
            </p>
            {onEmptyAction && (
              <Button onClick={onEmptyAction} size="sm">
                {emptyActionLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={variant === 'trending' ? "space-y-3" : "space-y-4"}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">{title}</h2>
            <span className="text-xs text-muted-foreground">
              ({communities.length})
            </span>
            {onCreateAction && (
              <Button
                variant="default"
                size="sm"
                onClick={onCreateAction}
                className="h-6 w-6 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white ml-1"
                title="Create new community"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {showPagination && totalPages > 1 && (
            <div className="text-xs text-muted-foreground">
              Page {currentPage}/{totalPages}
            </div>
          )}
        </div>
      )}

      {/* Grid - more compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentCommunities.map((community) => (
          <DAOCard
            key={community.id}
            dao={community}
            currentUserPubkey={currentUserPubkey}
            onJoinDAO={onJoinCommunity}
            variant={variant}
            routePrefix="communities"
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-3 w-3" />
            Prev
          </Button>

          <div className="flex items-center gap-0.5">
            {getPageNumbers.map((page, index) => 
              page === '...' ? (
                <span key={index} className="px-1 text-xs text-muted-foreground">...</span>
              ) : (
                <Button
                  key={index}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className="w-8 h-8 p-0 text-xs"
                >
                  {page}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="h-8 px-2 text-xs"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {showPagination && totalPages > 1 && (
        <div className="text-center text-xs text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, communities.length)} of {communities.length}
        </div>
      )}
    </div>
  );
};

export default CommunitiesGrid; 

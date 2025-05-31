import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  TrendingUp, 
  Crown,
  Shield,
  Activity,
  Dot,
  Sparkles,
  Star
} from "lucide-react";
import { DAO } from "@/api/types/dao";

interface DAOCardProps {
  dao: DAO;
  currentUserPubkey: string;
  onJoinDAO?: (daoId: string, daoName: string) => void;
  variant?: 'default' | 'trending';
  showJoinButton?: boolean;
  showMemberBadge?: boolean;
  showTrendingBadge?: boolean;
  routePrefix?: 'dao' | 'communities'; // Add route prefix option
}

const DAOCard: React.FC<DAOCardProps> = ({ 
  dao, 
  currentUserPubkey, 
  onJoinDAO,
  variant = 'default',
  showJoinButton = true,
  showMemberBadge = false,
  showTrendingBadge = false,
  routePrefix = 'dao' // Default to 'dao' for backward compatibility
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Validate DAO object
  if (!dao || !dao.id || !dao.name) {
    console.error('DAOCard: Invalid DAO object', dao);
    return null;
  }
  
  const isMember = dao.members?.includes(currentUserPubkey) || false;
  const isCreator = dao.creator === currentUserPubkey;
  const isModerator = dao.moderators?.includes(currentUserPubkey) || false;
  
  const handleCardClick = () => {
    setIsNavigating(true);
    // Add small delay to show loading state
    setTimeout(() => {
      navigate(`/${routePrefix}/${dao.id}`);
    }, 100);
  };
  
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMember) {
      // If user is already a member, navigate to community
      setIsNavigating(true);
      setTimeout(() => {
        navigate(`/${routePrefix}/${dao.id}`);
      }, 100);
    } else if (onJoinDAO) {
      // If user is not a member and onJoinDAO is provided, call it
      onJoinDAO(dao.id, dao.name);
    } else {
      // Fallback to navigation
      setIsNavigating(true);
      setTimeout(() => {
        navigate(`/${routePrefix}/${dao.id}`);
      }, 100);
    }
  };
  
  const createdAt = dao.createdAt 
    ? formatDistanceToNow(new Date(dao.createdAt * 1000), { addSuffix: true }) 
    : "Recently";
  
  // Calculate engagement for trending cards
  const engagementScore = variant === 'trending' 
    ? Math.floor(Math.random() * 40) + 60 // 60-100 for trending
    : null;
  
  const activityLevel = (dao.activeProposals || 0) > 0 || (dao.proposals || 0) > 5 ? 'high' : 
                      (dao.proposals || 0) > 2 ? 'medium' : 'low';

  // Get dynamic gradient based on DAO ID for consistent colors
  const getCardGradient = (id: string): string => {
    const gradients = [
      "from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20",
      "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
      "from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20",
      "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
      "from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20",
      "from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/20",
      "from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20",
      "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20"
    ];
    
    const hash = id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  const cardGradient = getCardGradient(dao.id);

  return (
    <Card 
      className={`overflow-hidden transition-all duration-500 cursor-pointer flex flex-col h-full group relative
        hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20
        ${variant === 'trending' 
          ? 'ring-2 ring-orange-200 dark:ring-orange-800 hover:ring-orange-300 dark:hover:ring-orange-700 bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10' 
          : `bg-gradient-to-br ${cardGradient} hover:shadow-primary/15 border-border/50 hover:border-primary/30`
        }
        ${isMember ? 'ring-2 ring-primary/30 shadow-lg shadow-primary/10' : ''}
        ${isNavigating ? 'opacity-75 scale-[0.98] pointer-events-none' : ''}
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Loading overlay */}
      {isNavigating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary/10 to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }} />
      </div>

      {/* Header Image - Enhanced */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-primary/15">
        {dao.image && (
          <img 
            src={dao.image} 
            alt={dao.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Enhanced badges with better positioning */}
        {variant === 'trending' && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs h-5 px-2 shadow-lg border-0">
              <TrendingUp className="h-2.5 w-2.5 mr-1" />
              Trending
              <Sparkles className="h-2.5 w-2.5 ml-1 animate-pulse" />
            </Badge>
          </div>
        )}

        {/* Enhanced activity indicator */}
        <div className="absolute top-2 right-2">
          <div className={`w-2.5 h-2.5 rounded-full shadow-lg border border-white/50 ${
            activityLevel === 'high' ? 'bg-green-500 animate-pulse' :
            activityLevel === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
        </div>

        {/* Enhanced role badges */}
        {isCreator && (
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs h-5 px-2 shadow-lg border-0">
              <Crown className="h-2.5 w-2.5 mr-1" />
              Owner
            </Badge>
          </div>
        )}
        
        {isMember && !isCreator && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs h-5 px-2 shadow-lg border-0">
              <Users className="h-2.5 w-2.5 mr-1" />
              Member
            </Badge>
          </div>
        )}

        {/* Premium member indicator */}
        {isMember && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <Star className="h-3.5 w-3.5 text-yellow-400 animate-pulse drop-shadow-lg" />
          </div>
        )}
      </div>
      
      {/* Content - Enhanced layout */}
      <div className="flex flex-col flex-grow p-4 relative z-10">
        {/* Header with improved spacing */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-9 w-9 border-2 border-white/50 shadow-lg ring-2 ring-primary/20">
            <AvatarImage 
              src={dao.avatar || dao.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${dao.id}`} 
              alt={dao.name} 
            />
            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
              {dao.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight truncate mb-1" title={dao.name}>
              {dao.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-medium">{dao.members?.length || 0}</span>
              </div>
              {variant === 'trending' && (
                <>
                  <Dot className="h-2.5 w-2.5" />
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span className="font-medium">{dao.activeProposals || 0}</span>
                  </div>
                </>
              )}
              <Dot className="h-2.5 w-2.5" />
              <span className="text-xs">{createdAt}</span>
            </div>
          </div>
        </div>
        
        {/* Description with better typography */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-grow leading-relaxed">
          {dao.description || "No description provided"}
        </p>
        
        {/* Enhanced trending metrics */}
        {variant === 'trending' && engagementScore && (
          <div className="mb-3 p-2.5 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">Engagement</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{engagementScore}%</span>
            </div>
            <Progress value={engagementScore} className="h-1.5 bg-orange-100 dark:bg-orange-900/30">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500" />
            </Progress>
          </div>
        )}
        
        {/* Enhanced tags and join button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {(dao.tags || []).slice(0, 2).map(tag => (
              <Badge variant="outline" key={tag} className="text-xs h-4 px-1.5 py-0 bg-white/50 dark:bg-black/20 border-primary/20 hover:border-primary/40 transition-colors">
                {tag}
              </Badge>
            ))}
            {(dao.tags?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs h-4 px-1.5 py-0 bg-white/50 dark:bg-black/20 border-primary/20">
                +{(dao.tags?.length || 0) - 2}
              </Badge>
            )}
          </div>
          
          {showJoinButton && (
            <Button 
              size="sm" 
              variant={isMember ? "outline" : "default"}
              onClick={handleJoinClick}
              className={`h-7 px-3 text-xs font-medium transition-all duration-300 ${
                isMember 
                  ? 'border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm' 
                  : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg'
              }`}
              title={isMember ? "Click to view community" : "Join this community"}
            >
              {isMember ? (isCreator ? "Manage" : "View") : "Join"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DAOCard;



import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Users } from "lucide-react";
import { nostrService, EVENT_KINDS } from "@/lib/nostr";
import CreateCommunityDialog from "./community/CreateCommunityDialog";
import { useToast } from "./ui/use-toast";

interface CommunitiesProps {
  limit?: number;
  showCreateButton?: boolean;
  showNavigationButton?: boolean;
}

const Communities = ({ 
  limit = 3, 
  showCreateButton = true,
  showNavigationButton = true
}: CommunitiesProps) => {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      
      try {
        // Subscribe to community definition events
        const subId = nostrService.subscribe(
          [
            {
              kinds: [EVENT_KINDS.COMMUNITY_DEFINITION], 
              limit: limit * 3 // Fetch more than needed to filter
            }
          ],
          (event) => {
            try {
              const community = JSON.parse(event.content);
              
              // Add additional metadata from the event
              community.id = event.id;
              community.pubkey = event.pubkey;
              community.created_at = event.created_at;
              
              // Get community ID from d tag if available
              const dTag = event.tags.find(tag => tag[0] === 'd');
              if (dTag && dTag[1]) {
                community.community_id = dTag[1];
              }
              
              setCommunities(prev => {
                const index = prev.findIndex(c => c.id === event.id);
                
                if (index !== -1) {
                  // Update existing community
                  const updated = [...prev];
                  updated[index] = community;
                  return updated;
                } else {
                  // Add new community
                  const newCommunities = [...prev, community];
                  // Sort by most recent first
                  newCommunities.sort((a, b) => b.created_at - a.created_at);
                  // Limit results
                  return newCommunities.slice(0, limit);
                }
              });
            } catch (e) {
              console.error('Failed to parse community data:', e);
            }
          }
        );
        
        // Set timeout to stop loading state if no communities are found
        setTimeout(() => {
          setLoading(false);
        }, 3000);
        
        return () => {
          if (subId) {
            nostrService.unsubscribe(subId);
          }
        };
      } catch (error) {
        console.error("Error fetching communities:", error);
        setLoading(false);
      }
    };
    
    fetchCommunities();
  }, [limit]);
  
  const handleCreateCommunity = async (data: any) => {
    try {
      const eventId = await nostrService.createCommunity(data);
      
      if (eventId) {
        toast({
          title: "Community created successfully",
          description: `Your community "${data.name}" has been created.`
        });
        
        // Navigate to the community page
        navigate(`/community/${eventId}`);
      } else {
        toast({
          title: "Error creating community",
          description: "Failed to create community. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast({
        title: "Error creating community",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (communities.length > 0) {
      setLoading(false);
    }
  }, [communities]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Communities</h2>
        {showCreateButton && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: limit }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : communities.length > 0 ? (
          communities.map((community) => (
            <Card key={community.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{community.name}</h3>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      <span>
                        {community.member_count || 0} members
                      </span>
                    </div>
                  </div>
                  {community.picture ? (
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                      <img 
                        src={community.picture} 
                        alt={community.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "placeholder.svg";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                {community.description && (
                  <p className="text-sm mt-2 line-clamp-2">
                    {community.description}
                  </p>
                )}
              </CardContent>
              <CardFooter className="p-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/community/${community.id}`)}
                >
                  View Community
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="bg-muted/40 rounded-lg p-6 text-center">
            <p className="text-muted-foreground mb-2">No communities found</p>
            <Button 
              size="sm" 
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create a Community
            </Button>
          </div>
        )}
      </div>
      
      {showNavigationButton && communities.length > 0 && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/communities")}
          >
            View All Communities
          </Button>
        </div>
      )}
      
      <CreateCommunityDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateCommunity={handleCreateCommunity}
      />
    </div>
  );
};

export default Communities;

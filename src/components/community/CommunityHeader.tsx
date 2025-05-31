import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Copy } from "lucide-react";
import CommunityHeaderImage from "./CommunityHeaderImage";
import CommunityDescription from "./CommunityDescription";
import LeaveCommunityButton from "./LeaveCommunityButton";
import { toast } from "@/lib/toast";

interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  isPrivate?: boolean;
  tags?: string[];
  alphaWallet?: string;
  avatar?: string;
}

interface CommunityHeaderProps {
  community: Community;
  currentUserPubkey: string | null;
  userRole: 'creator' | 'moderator' | 'member' | null;
  onLeaveCommunity: () => void;
  onDeleteCommunity?: () => Promise<void>;
  isCreatorOnlyMember?: boolean;
  onMembersClick?: () => void;
}

const CommunityHeader = ({ 
  community, 
  currentUserPubkey, 
  userRole,
  onLeaveCommunity,
  onDeleteCommunity,
  isCreatorOnlyMember = false,
  onMembersClick
}: CommunityHeaderProps) => {
  // Determine if the user can delete the community (creator and only member)
  const canDelete = userRole === 'creator' && isCreatorOnlyMember && !!onDeleteCommunity;
  
  const handleCopyWallet = async () => {
    if (community.alphaWallet) {
      try {
        await navigator.clipboard.writeText(community.alphaWallet);
        toast.success("Wallet address copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy wallet address");
      }
    }
  };
  
  return (
    <Card>
      <CommunityHeaderImage 
        id={community.id}
        name={community.name}
        image={community.image}
        avatar={community.avatar}
        showDeleteButton={canDelete}
        onDelete={onDeleteCommunity}
      />
      
      <CardContent className="pt-6 space-y-4">
        <CommunityDescription 
          description={community.description}
          membersCount={community.members.length}
          createdAt={community.createdAt}
          isPrivate={community.isPrivate}
          onMembersClick={onMembersClick}
        />
        
        {/* Alpha Wallet */}
        {community.alphaWallet && (
          <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Community Alpha Wallet</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyWallet}
                  title="Copy wallet address"
                  className="h-8 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://explorer.alephium.org/addresses/${community.alphaWallet}`, '_blank')}
                  title="View on Alephium Explorer"
                  className="h-8 px-2"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <code className="text-xs bg-background/50 px-2 py-1 rounded border">
                {community.alphaWallet.length > 30 
                  ? `${community.alphaWallet.substring(0, 15)}...${community.alphaWallet.substring(community.alphaWallet.length - 15)}`
                  : community.alphaWallet
                }
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Track community funds and transactions transparently
            </p>
          </div>
        )}
        
        {/* Tags */}
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {community.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
        
        {userRole === 'member' && (
          <LeaveCommunityButton 
            onLeave={onLeaveCommunity} 
            communityName={community.name} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityHeader;


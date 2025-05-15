
import { Loader2, Coins } from "lucide-react";
import { Community } from "./CommunityCard";
import EmptyCommunityState from "./EmptyCommunityState";
import UserCommunitiesSection from "./UserCommunitiesSection";
import DiscoverCommunitiesSection from "./DiscoverCommunitiesSection";
import { Button } from "@/components/ui/button";
import { AlephiumCommunity } from "@/lib/alephium/communityService";
import { ConnectionStatus } from "@alephium/web3-react";

interface CommunitiesGridProps {
  communities: Community[];
  userCommunities: Community[];
  filteredCommunities: Community[];
  loading: boolean;
  currentUserPubkey: string | null;
  onCreateCommunity: () => void;
  onChainCommunities?: AlephiumCommunity[]; // New prop for on-chain communities
  filterBlockchain?: 'all' | 'onchain' | 'offchain'; // New prop for filtering
  walletStatus?: ConnectionStatus; // Wallet connection status
}

const CommunitiesGrid = ({ 
  communities,
  userCommunities,
  filteredCommunities,
  loading,
  currentUserPubkey,
  onCreateCommunity,
  onChainCommunities = [],
  filterBlockchain = 'all',
  walletStatus = 'disconnected'
}: CommunitiesGridProps) => {
  
  const isWalletConnected = walletStatus === 'connected';
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Show empty state with specific message based on filter
  if (filteredCommunities.length === 0) {
    return (
      <div className="py-4">
        {filterBlockchain === 'onchain' ? (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No On-chain Communities</h3>
            <p className="text-muted-foreground mb-6">
              {isWalletConnected ? 
                "No on-chain communities found. Create the first one!" :
                "Connect your wallet to create an on-chain community"
              }
            </p>
            <Button onClick={onCreateCommunity} disabled={!isWalletConnected}>
              <Coins className="h-4 w-4 mr-2" />
              Create On-chain Community
            </Button>
          </div>
        ) : (
          <EmptyCommunityState onCreateCommunity={onCreateCommunity} />
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-10 animate-fade-in">
      {filterBlockchain !== 'offchain' && onChainCommunities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Coins className="h-5 w-5 mr-2 text-amber-500" />
              On-chain Communities
            </h2>
            <Button variant="outline" size="sm" onClick={onCreateCommunity} disabled={!isWalletConnected}>
              <Coins className="h-4 w-4 mr-2" />
              Create On-chain Community
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {onChainCommunities.map(community => (
              <div key={community.contractId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    {community.name}
                    <Coins className="h-4 w-4 ml-2 text-amber-500" />
                  </h3>
                  
                  {community.isPrivate && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      Private
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {community.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{community.memberCount} members</span>
                  <span className="truncate max-w-[120px]" title={community.contractId}>
                    Contract: {community.contractId.substring(0, 6)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {userCommunities.length > 0 && filterBlockchain !== 'onchain' && (
        <UserCommunitiesSection 
          communities={userCommunities}
          currentUserPubkey={currentUserPubkey}
        />
      )}
      
      {filterBlockchain !== 'onchain' && (
        <DiscoverCommunitiesSection 
          communities={filteredCommunities}
          userCommunities={userCommunities}
          currentUserPubkey={currentUserPubkey}
        />
      )}
    </div>
  );
};

export default CommunitiesGrid;

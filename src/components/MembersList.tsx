
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Users } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
}

export interface KickProposal {
  id: string;
  communityId: string;
  targetMember: string;
  votes: string[];
  createdAt: number;
}

interface MembersListProps {
  community: Community;
  currentUserPubkey: string | null;
  onKickProposal: (targetMember: string) => void;
  kickProposals: KickProposal[];
  onVoteKick?: (kickProposalId: string) => void; 
  onLeaveCommunity: () => void;
}

const MembersList: React.FC<MembersListProps> = ({ 
  community,
  currentUserPubkey,
  onKickProposal,
  kickProposals,
  onVoteKick,
  onLeaveCommunity
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const isCreator = community.creator === currentUserPubkey;
  const isMember = community.members.includes(currentUserPubkey || '');
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const sortedMembers = [...community.members].sort((a, b) => {
    // Creator always first
    if (a === community.creator) return -1;
    if (b === community.creator) return 1;
    return 0;
  });
  
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  const canInitiateKick = (memberPubkey: string) => {
    return (
      isMember && 
      memberPubkey !== community.creator && // Can't kick creator
      memberPubkey !== currentUserPubkey && // Can't kick self
      !kickProposals.some(p => p.targetMember === memberPubkey) // No existing proposal
    );
  };
  
  const canVoteOnKick = (proposal: KickProposal) => {
    return (
      isMember && 
      currentUserPubkey && 
      !proposal.votes.includes(currentUserPubkey)
    );
  };
  
  const getKickProposalForMember = (memberPubkey: string) => {
    return kickProposals.find(p => p.targetMember === memberPubkey);
  };
  
  const getKickProgress = (proposal: KickProposal) => {
    const totalMembers = community.members.length;
    const votesNeeded = Math.ceil(totalMembers * 0.51);
    const currentVotes = proposal.votes.length;
    const percentage = Math.min(Math.round((currentVotes / votesNeeded) * 100), 100);
    
    return {
      percentage,
      votesNeeded,
      currentVotes,
      reachedThreshold: currentVotes >= votesNeeded
    };
  };
  
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Members
          </CardTitle>
          <span className="text-muted-foreground text-sm">{community.members.length}</span>
        </div>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto space-y-4">
        {sortedMembers.map((member) => {
          const isCurrentUser = member === currentUserPubkey;
          const isCommCreator = member === community.creator;
          const kickProposal = getKickProposalForMember(member);
          
          return (
            <div key={member} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.substring(0, 8)}`} />
                  <AvatarFallback>{member.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm flex items-center">
                    {nostrService.getNpubFromHex(member).substring(0, 8)}...
                    {isCurrentUser && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                    {isCommCreator && <span className="ml-1 text-xs text-primary">(creator)</span>}
                  </div>
                </div>
              </div>
              
              {/* Kick options */}
              {kickProposal && (
                <div className="flex items-center">
                  {onVoteKick && canVoteOnKick(kickProposal) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onVoteKick(kickProposal.id)}
                      className="text-xs h-6 px-2"
                    >
                      Vote to Remove
                    </Button>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-2 text-xs text-muted-foreground">
                          {(() => {
                            const progress = getKickProgress(kickProposal);
                            return `${progress.currentVotes}/${progress.votesNeeded} votes`;
                          })()}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Started {formatTime(kickProposal.createdAt)}</p>
                        <p>{kickProposal.votes.length} member(s) voted to remove</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              {(!isCommCreator && !isCurrentUser && isMember && !kickProposal) && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canInitiateKick(member) && (
                        <DropdownMenuItem 
                          className="text-red-500 cursor-pointer"
                          onClick={() => onKickProposal(member)}
                        >
                          Propose to remove
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MembersList;

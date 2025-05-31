import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Users, Shield, UserPlus, Crown, UserCheck } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MemberRole } from "@/api/types/community";
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
  moderators?: string[];
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
  userRole: MemberRole | null;
  canKickPropose: boolean;
  isMember: boolean;
  onCreateInvite: (maxUses?: number, expiresIn?: number) => Promise<string | null>;
}

const MembersList: React.FC<MembersListProps> = ({ 
  community,
  currentUserPubkey,
  onKickProposal,
  kickProposals,
  onVoteKick,
  onLeaveCommunity,
  userRole,
  canKickPropose,
  isMember,
  onCreateInvite
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  
  const isCreator = userRole === 'creator';
  const isModerator = userRole === 'moderator';
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Group members by role
  const owner = community.members.filter(member => member === community.creator);
  const moderators = community.members.filter(member => 
    member !== community.creator && (community.moderators?.includes(member) || false)
  );
  const regularMembers = community.members.filter(member => 
    member !== community.creator && !(community.moderators?.includes(member) || false)
  );

  // Get member display name (you can enhance this with actual names later)
  const getMemberDisplayName = (pubkey: string) => {
    // For now, return a shortened npub. Later this can be enhanced with actual names
    return nostrService.getNpubFromHex(pubkey).substring(0, 8) + "...";
  };
  
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  const canInitiateKick = (memberPubkey: string) => {
    return (
      canKickPropose &&
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
  


  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const inviteId = await onCreateInvite();
      if (inviteId) {
        const inviteUrl = `${window.location.origin}/invite/${inviteId}`;
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Invite link created and copied to clipboard!");
      } else {
        toast.error("Failed to create invite link");
      }
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Failed to create invite link");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleFollowMember = async (memberPubkey: string) => {
    try {
      // TODO: Implement follow functionality
      toast.success("Follow functionality coming soon!");
    } catch (error) {
      console.error("Error following member:", error);
      toast.error("Failed to follow member");
    }
  };

  const renderMemberItem = (member: string, roleIcon?: React.ReactNode, roleLabel?: string) => {
    const isCurrentUser = member === currentUserPubkey;
    const kickProposal = getKickProposalForMember(member);
    
    return (
      <div key={member} className="flex items-center justify-between group py-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.substring(0, 8)}`} />
            <AvatarFallback className="text-xs">{member.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-xs flex items-center min-w-0">
              <span className="truncate">
                {getMemberDisplayName(member)}
              </span>
              {isCurrentUser && <span className="ml-1 text-xs text-muted-foreground flex-shrink-0">(you)</span>}
              {roleIcon && <span className="ml-1 flex-shrink-0">{roleIcon}</span>}
            </div>
          </div>
        </div>

        {/* Kick options */}
        {kickProposal && (
          <div className="flex items-center flex-shrink-0">
            {onVoteKick && canVoteOnKick(kickProposal) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onVoteKick(kickProposal.id)}
                className="text-xs h-5 px-1"
              >
                Vote
              </Button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-1 text-xs text-muted-foreground">
                    {(() => {
                      const progress = getKickProgress(kickProposal);
                      return `${progress.currentVotes}/${progress.votesNeeded}`;
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
        
        {/* Member options dropdown */}
        {(!(member === community.creator) && isMember && !kickProposal) && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0"
                  title="Member options"
                  aria-label="Open member options menu"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isCurrentUser && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleFollowMember(member)}
                  >
                    <UserCheck className="h-3 w-3 mr-2" />
                    Follow Member
                  </DropdownMenuItem>
                )}
                {canInitiateKick(member) && (
                  <>
                    {!isCurrentUser && <DropdownMenuSeparator />}
                    <DropdownMenuItem 
                      className="text-red-500 cursor-pointer"
                      onClick={() => onKickProposal(member)}
                    >
                      <Shield className="h-3 w-3 mr-2" />
                      Propose to kick
                    </DropdownMenuItem>
                  </>
                )}
                {isCurrentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-orange-500 cursor-pointer"
                      onClick={onLeaveCommunity}
                    >
                      Leave community
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="sticky top-20 min-w-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center min-w-0">
          <CardTitle className="text-base flex items-center min-w-0">
            <Users className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">Members</span>
          </CardTitle>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-muted-foreground text-xs">{community.members.length}</span>
            {isMember && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={handleCreateInvite}
                      disabled={isCreatingInvite}
                      title="Create invite link"
                      aria-label="Create invite link"
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create invite link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[60vh] overflow-y-auto overflow-x-hidden space-y-3 pt-0">
        {/* Owner Section */}
        {owner.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Crown className="h-3 w-3 text-yellow-500" />
              <span>Owner</span>
            </div>
            {owner.map((member) => renderMemberItem(
              member, 
              <Crown className="h-2.5 w-2.5 text-yellow-500" />,
              "Owner"
            ))}
          </div>
        )}

        {/* Moderators Section */}
        {moderators.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Shield className="h-3 w-3 text-amber-500" />
              <span>Moderators ({moderators.length})</span>
            </div>
            {moderators.map((member) => renderMemberItem(
              member,
              <Shield className="h-2.5 w-2.5 text-amber-500" />,
              "Moderator"
            ))}
          </div>
        )}

        {/* Members Section */}
        {regularMembers.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Members ({regularMembers.length})</span>
            </div>
            {regularMembers.map((member) => renderMemberItem(member))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersList;


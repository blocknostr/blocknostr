import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

interface MembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const MembersDialog: React.FC<MembersDialogProps> = ({ 
  open,
  onOpenChange,
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
      <div key={member} className="flex items-center justify-between group py-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.substring(0, 8)}`} />
            <AvatarFallback className="text-sm">{member.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm flex items-center min-w-0">
              <span className="truncate">
                {getMemberDisplayName(member)}
              </span>
              {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">(you)</span>}
              {roleIcon && <span className="ml-2 flex-shrink-0">{roleIcon}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Kick options */}
          {kickProposal && (
            <div className="flex items-center">
              {onVoteKick && canVoteOnKick(kickProposal) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onVoteKick(kickProposal.id)}
                  className="text-xs h-7 px-2"
                >
                  Vote
                </Button>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2 text-xs text-muted-foreground">
                      {(() => {
                        const progress = getKickProgress(kickProposal);
                        return `${progress.currentVotes}/${progress.votesNeeded}`;
                      })()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Started {formatTime(kickProposal.createdAt)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Member actions menu */}
          {!isCurrentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFollowMember(member)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Follow Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canInitiateKick(member) && (
                  <DropdownMenuItem 
                    onClick={() => onKickProposal(member)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Propose to kick
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const renderMemberSection = (
    title: string,
    members: string[],
    icon: React.ReactNode,
    roleIcon?: React.ReactNode,
    roleLabel?: string
  ) => {
    if (members.length === 0) return null;

    const sectionKey = title.toLowerCase().replace(/\s+/g, '-');
    const isExpanded = expandedSection === sectionKey;

    return (
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => toggleSection(sectionKey)}
          className="w-full justify-between p-2 h-auto"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
            <span className="text-xs text-muted-foreground">({members.length})</span>
          </div>
        </Button>
        
        {(isExpanded || members.length <= 3) && (
          <div className="space-y-1 px-2">
            {members.map(member => renderMemberItem(member, roleIcon, roleLabel))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] w-[95vw] sm:w-full">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({community.members.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
          {/* Invite Section */}
          {(isCreator || isModerator) && (
            <div className="border-b pb-4 flex-shrink-0">
              <Button
                onClick={handleCreateInvite}
                disabled={isCreatingInvite}
                size="sm"
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isCreatingInvite ? "Creating..." : "Create Invite Link"}
              </Button>
            </div>
          )}

          {/* Members by Role */}
          <div className="space-y-4 pb-4">
            {renderMemberSection(
              "Owner",
              owner,
              <Crown className="h-4 w-4 text-yellow-500" />,
              <Crown className="h-3 w-3 text-yellow-500" />,
              "Owner"
            )}

            {renderMemberSection(
              "Moderators",
              moderators,
              <Shield className="h-4 w-4 text-blue-500" />,
              <Shield className="h-3 w-3 text-blue-500" />,
              "Moderator"
            )}

            {renderMemberSection(
              "Members",
              regularMembers,
              <Users className="h-4 w-4 text-gray-500" />,
              undefined,
              "Member"
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembersDialog; 

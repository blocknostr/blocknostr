
import React, { useState, useEffect } from "react";
import { Search, Shield, Crown, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAO } from "@/types/dao";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { nostrService } from "@/lib/nostr";

interface DAOMembersListProps {
  dao: DAO;
  currentUserPubkey: string | null;
  onKickProposal?: (memberToKick: string, reason: string) => Promise<boolean>;
  kickProposals?: any[];
  onVoteKick?: (proposalId: string, vote: boolean) => Promise<boolean>;
  onLeaveDAO?: () => void;
  userRole?: 'creator' | 'moderator' | 'member' | null;
  canKickPropose?: boolean;
}

interface MemberProfile {
  pubkey: string;
  displayName: string;
  picture: string;
  nip05: string;
  role: 'creator' | 'moderator' | 'member';
}

const DAOMembersList: React.FC<DAOMembersListProps> = ({
  dao, 
  currentUserPubkey,
  onKickProposal,
  userRole,
  canKickPropose = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [kickReason, setKickReason] = useState("");
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false);
  const [isSubmittingKick, setIsSubmittingKick] = useState(false);
  
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const memberProfiles: MemberProfile[] = [];
        
        // Process all members
        for (const pubkey of dao.members) {
          // Fix: Use getUserProfile instead of getProfile
          const profile = await nostrService.getUserProfile(pubkey);
          
          let role: 'creator' | 'moderator' | 'member' = 'member';
          if (pubkey === dao.creator) role = 'creator';
          else if (dao.moderators.includes(pubkey)) role = 'moderator';
          
          memberProfiles.push({
            pubkey,
            displayName: profile?.name || profile?.displayName || pubkey.substring(0, 8),
            picture: profile?.picture || '',
            nip05: profile?.nip05 || '',
            role
          });
        }
        
        setMembers(memberProfiles);
      } catch (error) {
        console.error("Error fetching member profiles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [dao]);
  
  const filteredMembers = searchTerm
    ? members.filter(member => 
        member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.pubkey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.nip05?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;
  
  // Sort by role (creator first, then moderators, then members)
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const roleOrder = { creator: 0, moderator: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'creator':
        return <Badge variant="default" className="bg-amber-500"><Crown className="h-3 w-3 mr-1" /> Creator</Badge>;
      case 'moderator':
        return <Badge variant="default" className="bg-blue-500"><Shield className="h-3 w-3 mr-1" /> Moderator</Badge>;
      default:
        return null;
    }
  };
  
  const handleKickMember = async () => {
    if (!selectedMember || !onKickProposal) return;
    
    setIsSubmittingKick(true);
    try {
      const success = await onKickProposal(selectedMember.pubkey, kickReason);
      if (success) {
        setIsKickDialogOpen(false);
        setKickReason("");
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
    } finally {
      setIsSubmittingKick(false);
    }
  };
  
  const openKickDialog = (member: MemberProfile) => {
    // Don't allow kicking the creator or yourself
    if (member.role === 'creator' || member.pubkey === currentUserPubkey) return;
    
    setSelectedMember(member);
    setKickReason("");
    setIsKickDialogOpen(true);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Members ({dao.members.length})</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : sortedMembers.length > 0 ? (
          <div className="space-y-3">
            {sortedMembers.map((member) => (
              <div 
                key={member.pubkey} 
                className={`flex items-center justify-between p-2 rounded-md ${
                  member.pubkey === currentUserPubkey ? 'bg-muted/50' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.picture} alt={member.displayName} />
                    <AvatarFallback>{member.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {member.nip05 || member.pubkey.substring(0, 16) + '...'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}
                  
                  {member.pubkey === currentUserPubkey && (
                    <Badge variant="outline">You</Badge>
                  )}
                  
                  {canKickPropose && member.role !== 'creator' && member.pubkey !== currentUserPubkey && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openKickDialog(member)}
                      title="Propose to kick this member"
                    >
                      <UserX className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No members found</p>
          </div>
        )}
        
        {/* Kick Dialog */}
        <Dialog open={isKickDialogOpen} onOpenChange={setIsKickDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose to Remove Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedMember && (
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                  <Avatar>
                    <AvatarImage src={selectedMember.picture} alt={selectedMember.displayName} />
                    <AvatarFallback>{selectedMember.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMember.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMember.nip05 || selectedMember.pubkey.substring(0, 16) + '...'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="kickReason" className="text-sm font-medium">
                  Reason (required)
                </label>
                <Textarea
                  id="kickReason"
                  value={kickReason}
                  onChange={(e) => setKickReason(e.target.value)}
                  placeholder="Explain why this member should be removed from the DAO"
                  className="min-h-[100px]"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsKickDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleKickMember}
                  disabled={!kickReason.trim() || isSubmittingKick}
                >
                  {isSubmittingKick ? "Creating Proposal..." : "Create Kick Proposal"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DAOMembersList;

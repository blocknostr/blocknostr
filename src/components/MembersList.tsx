
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Check, UserMinus, Shield, Users } from "lucide-react";

interface MembersListProps {
  community: {
    id: string;
    uniqueId: string;
    name: string;
    description: string;
    image: string;
    creator: string;
    createdAt: number;
    members: string[];
  };
  currentUserPubkey: string | null;
  onKickProposal: (targetMember: string) => Promise<void>;
  kickProposals: KickProposal[];
}

export interface KickProposal {
  id: string;
  communityId: string;
  targetMember: string;
  votes: string[]; // Array of pubkeys who voted to kick
  createdAt: number;
}

const MembersList = ({ community, currentUserPubkey, onKickProposal, kickProposals }: MembersListProps) => {
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const handleKickClick = (member: string) => {
    setSelectedMember(member);
    setKickDialogOpen(true);
  };
  
  const isCreator = (member: string) => member === community.creator;
  const isMemberBeingKicked = (member: string) => kickProposals.some(kp => kp.targetMember === member);
  
  // Check if current user has already voted on a kick proposal
  const hasVotedToKick = (member: string) => {
    const proposal = kickProposals.find(kp => kp.targetMember === member);
    return proposal ? proposal.votes.includes(currentUserPubkey || '') : false;
  };
  
  // Calculate if we have enough votes to kick (51% of members)
  const getKickPercentage = (member: string) => {
    const proposal = kickProposals.find(kp => kp.targetMember === member);
    if (!proposal) return 0;
    
    return Math.round((proposal.votes.length / community.members.length) * 100);
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({community.members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="space-y-1">
          {community.members.map((member) => (
            <div 
              key={member} 
              className={`flex items-center justify-between p-2 rounded-md ${isCreator(member) ? 'bg-primary/10' : 'hover:bg-muted'}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.substring(0, 8)}`} />
                  <AvatarFallback>{member.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">
                    {nostrService.getNpubFromHex(member).substring(0, 8)}...
                  </p>
                </div>
                {isCreator(member) && (
                  <Shield className="h-3.5 w-3.5 text-primary ml-1" />
                )}
              </div>
              
              {/* Kick controls */}
              {!isCreator(member) && 
               member !== currentUserPubkey && 
               currentUserPubkey && 
               community.members.includes(currentUserPubkey) && (
                <div className="flex items-center">
                  {isMemberBeingKicked(member) && (
                    <div className="mr-2 text-xs">
                      <span className="font-medium">{getKickPercentage(member)}%</span>
                    </div>
                  )}
                  
                  {hasVotedToKick(member) ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500" disabled>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => handleKickClick(member)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      
      <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kick member from community?</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            This will create a proposal to kick this member. If 51% of community members vote to kick, 
            the member will be removed from the community.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setKickDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (selectedMember) {
                  await onKickProposal(selectedMember);
                  setKickDialogOpen(false);
                }
              }}
            >
              Propose Kick
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MembersList;

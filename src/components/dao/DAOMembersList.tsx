
import React, { useState, useEffect } from "react";
import { Search, Shield, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAO } from "@/types/dao";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";

interface DAOMembersListProps {
  dao: DAO;
  currentUserPubkey: string | null;
}

interface MemberProfile {
  pubkey: string;
  displayName: string;
  picture: string;
  nip05: string;
  role: 'creator' | 'moderator' | 'member';
}

const DAOMembersList: React.FC<DAOMembersListProps> = ({ dao, currentUserPubkey }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const memberProfiles: MemberProfile[] = [];
        
        // Process all members
        for (const pubkey of dao.members) {
          const profile = await nostrService.getProfile(pubkey);
          
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
  
  return (
    <div>
      <div className="mb-6">
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
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Members ({dao.members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No members found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DAOMembersList;

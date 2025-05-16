
import React, { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import DAOGrid from "./DAOGrid";
import DAOEmptyState from "./DAOEmptyState";
import { DAO } from "@/types/dao";
import CreateDAODialog from "./CreateDAODialog";

interface DAOListProps {
  type: "discover" | "my-daos" | "trending";
}

const DAOList: React.FC<DAOListProps> = ({ type }) => {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [filteredDaos, setFilteredDaos] = useState<DAO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const currentUserPubkey = "user-pubkey-placeholder"; // This would come from your auth system
  
  // Mock data for demonstration
  useEffect(() => {
    const mockData: DAO[] = [
      {
        id: "dao-1",
        name: "AlephDAO",
        description: "Governance for the Alephium ecosystem",
        image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=225&fit=crop",
        creator: "creator-pubkey-1",
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        members: ["member-1", "member-2", "creator-pubkey-1", "user-pubkey-placeholder"],
        treasury: {
          balance: 450000,
          tokenSymbol: "ALPH"
        },
        proposals: 12,
        activeProposals: 3,
        tags: ["defi", "governance"]
      },
      {
        id: "dao-2",
        name: "NostrCollective",
        description: "Community-driven development of Nostr clients",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=225&fit=crop",
        creator: "creator-pubkey-2",
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        members: ["member-3", "member-4", "creator-pubkey-2"],
        treasury: {
          balance: 230000,
          tokenSymbol: "NST"
        },
        proposals: 24,
        activeProposals: 2,
        tags: ["social", "development"]
      },
      {
        id: "dao-3",
        name: "BlockNostrDAO",
        description: "Funding integration projects between Alephium and Nostr",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop",
        creator: "creator-pubkey-3",
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        members: ["member-5", "member-6", "creator-pubkey-3", "user-pubkey-placeholder"],
        treasury: {
          balance: 780000,
          tokenSymbol: "BNA"
        },
        proposals: 8,
        activeProposals: 5,
        tags: ["integration", "funding"]
      }
    ];
    
    // Simulate API call delay
    setTimeout(() => {
      const filteredByType = type === "my-daos" 
        ? mockData.filter(dao => dao.members.includes(currentUserPubkey))
        : type === "trending"
          ? [...mockData].sort((a, b) => b.members.length - a.members.length)
          : mockData;
      
      setDaos(filteredByType);
      setFilteredDaos(filteredByType);
      setLoading(false);
    }, 1000);
  }, [type, currentUserPubkey]);
  
  // Handle search filtering
  useEffect(() => {
    if (searchTerm) {
      const filtered = daos.filter(dao => 
        dao.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDaos(filtered);
    } else {
      setFilteredDaos(daos);
    }
  }, [searchTerm, daos]);
  
  const handleCreateDAO = (newDao: DAO) => {
    setDaos(prev => [newDao, ...prev]);
    setFilteredDaos(prev => [newDao, ...prev]);
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search DAOs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <CreateDAODialog 
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateDAO={handleCreateDAO}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDaos.length > 0 ? (
        <DAOGrid daos={filteredDaos} currentUserPubkey={currentUserPubkey} />
      ) : (
        <DAOEmptyState onCreateDAO={() => setCreateDialogOpen(true)} />
      )}
    </div>
  );
};

export default DAOList;

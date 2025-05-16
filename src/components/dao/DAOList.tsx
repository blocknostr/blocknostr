
import React, { useState } from "react";
import { Loader2, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DAOGrid from "./DAOGrid";
import DAOEmptyState from "./DAOEmptyState";
import { DAO } from "@/types/dao";
import CreateDAODialog from "./CreateDAODialog";
import { useDAO } from "@/hooks/useDAO";

interface DAOListProps {
  type: "discover" | "my-daos" | "trending";
}

const DAOList: React.FC<DAOListProps> = ({ type }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const {
    daos,
    myDaos,
    trendingDaos,
    loading,
    createDAO,
    currentUserPubkey
  } = useDAO();
  
  // Determine which list to use based on type
  const daoList = type === "my-daos" ? myDaos : 
                  type === "trending" ? trendingDaos : 
                  daos;
  
  // Filter by search term
  const filteredDaos = searchTerm 
    ? daoList.filter(dao => 
        dao.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : daoList;
  
  const handleCreateDAO = async (name: string, description: string, tags: string[]) => {
    const daoId = await createDAO(name, description, tags);
    if (daoId) {
      setCreateDialogOpen(false);
    }
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
        
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="w-full sm:w-auto"
          disabled={!currentUserPubkey}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create DAO
        </Button>
        
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
        <DAOGrid daos={filteredDaos} currentUserPubkey={currentUserPubkey || ""} />
      ) : (
        <DAOEmptyState onCreateDAO={() => setCreateDialogOpen(true)} />
      )}
    </div>
  );
};

export default DAOList;

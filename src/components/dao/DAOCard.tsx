
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { DAO } from "@/types/dao";
import { Users } from "lucide-react";

interface DAOCardProps {
  dao: DAO;
  currentUserPubkey: string;
  onJoinDAO?: (daoId: string, daoName: string) => void;
}

const DAOCard: React.FC<DAOCardProps> = ({ dao, currentUserPubkey, onJoinDAO }) => {
  const navigate = useNavigate();
  
  const isMember = dao.members.includes(currentUserPubkey);
  
  const handleCardClick = () => {
    navigate(`/dao/${dao.id}`);
  };
  
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onJoinDAO) {
      onJoinDAO(dao.id, dao.name);
    } else {
      navigate(`/dao/${dao.id}`);
    }
  };
  
  const createdAt = dao.createdAt ? formatDistanceToNow(new Date(dao.createdAt * 1000), { addSuffix: true }) : "Recently";
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <div className="h-32 overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
        {dao.image && (
          <img 
            src={dao.image} 
            alt={dao.name}
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://via.placeholder.com/400x150?text=DAO";
            }}
          />
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border">
              <AvatarImage 
                src={dao.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${dao.id}`} 
                alt={dao.name} 
              />
              <AvatarFallback>{dao.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{dao.name}</h3>
              <p className="text-xs text-muted-foreground">Created {createdAt}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {dao.description || "No description provided"}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {dao.tags.slice(0, 3).map(tag => (
            <Badge variant="outline" key={tag} className="text-xs">
              {tag}
            </Badge>
          ))}
          {dao.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{dao.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span>{dao.members.length} members</span>
          {dao.treasury.balance > 0 && (
            <span className="ml-2">
              • {dao.treasury.balance} {dao.treasury.tokenSymbol}
            </span>
          )}
        </div>
        
        <Button 
          size="sm" 
          variant={isMember ? "outline" : "default"}
          onClick={handleJoinClick}
          className={isMember ? "cursor-default pointer-events-none" : ""}
        >
          {isMember ? "Member" : "Join"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DAOCard;


import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Check, Shield } from "lucide-react";
import { DAO } from "@/types/dao";
import { formatDistanceToNow } from "date-fns";
import { useDAO } from "@/hooks/useDAO";

interface DAOCardProps {
  dao: DAO;
  currentUserPubkey: string;
}

const DAOCard: React.FC<DAOCardProps> = ({ dao, currentUserPubkey }) => {
  const { joinDAO } = useDAO();
  
  const isMember = dao.members.includes(currentUserPubkey);
  const isCreator = dao.creator === currentUserPubkey;
  const isModerator = dao.moderators?.includes(currentUserPubkey) || false;
  
  const memberCount = dao.members.length;
  const createdAt = new Date(dao.createdAt * 1000);
  
  const handleJoinDAO = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUserPubkey) return;
    
    await joinDAO(dao.id);
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col border border-border/40">
      <div className="relative h-24 overflow-hidden">
        <img 
          src={dao.image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop"} 
          alt={dao.name} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {isMember && (
            <Badge variant="default" className="bg-primary/80 hover:bg-primary text-xs font-medium py-0 h-5">
              <Check className="h-3 w-3 mr-1" /> Member
            </Badge>
          )}
          {isCreator && (
            <Badge variant="default" className="bg-amber-500/80 hover:bg-amber-500 text-xs font-medium py-0 h-5">
              Creator
            </Badge>
          )}
          {isModerator && !isCreator && (
            <Badge variant="default" className="bg-blue-500/80 hover:bg-blue-500 text-xs font-medium py-0 h-5">
              <Shield className="h-3 w-3 mr-1" /> Mod
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-3 pb-0 flex-grow">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
          <Link to={`/dao/${dao.id}`} className="hover:underline hover:text-primary">
            {dao.name}
          </Link>
        </h3>
        
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {dao.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-1">
          {dao.tags && dao.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs bg-muted/50 px-1.5 py-0 h-4">
              {tag}
            </Badge>
          ))}
          {dao.tags && dao.tags.length > 3 && (
            <Badge variant="outline" className="text-xs bg-muted/50 px-1.5 py-0 h-4">
              +{dao.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </div>
          <div className="text-xs">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-2">
        {isMember ? (
          <Button asChild variant="outline" className="w-full text-xs h-7">
            <Link to={`/dao/${dao.id}`}>
              View DAO
            </Link>
          </Button>
        ) : (
          <Button 
            className="w-full text-xs h-7"
            onClick={handleJoinDAO}
            disabled={!currentUserPubkey}
          >
            Join DAO
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DAOCard;

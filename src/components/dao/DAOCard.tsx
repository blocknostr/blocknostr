
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Check, Gavel, Shield } from "lucide-react";
import { DAO } from "@/types/dao";
import { formatDistanceToNow } from "date-fns";
import { useDAO } from "@/hooks/useDAO";
import { formatDAOSerialNumber } from "@/lib/dao/serial-number";

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
  
  // Format serial number if available
  const serialNumber = dao.serialNumber ? formatDAOSerialNumber(dao.serialNumber) : null;
  
  const handleJoinDAO = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUserPubkey) return;
    
    await joinDAO(dao.id);
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={dao.image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop"} 
          alt={dao.name} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {serialNumber && (
            <Badge variant="secondary" className="bg-black/70 text-white hover:bg-black/90">
              {serialNumber}
            </Badge>
          )}
          {isMember && (
            <Badge variant="default" className="bg-primary/80 hover:bg-primary">
              <Check className="h-3 w-3 mr-1" /> Member
            </Badge>
          )}
          {isCreator && (
            <Badge variant="default" className="bg-amber-500/80 hover:bg-amber-500">
              Creator
            </Badge>
          )}
          {isModerator && !isCreator && (
            <Badge variant="default" className="bg-blue-500/80 hover:bg-blue-500">
              <Shield className="h-3 w-3 mr-1" /> Moderator
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold hover:text-primary">
            <Link to={`/dao/${dao.id}`} className="hover:underline">
              {dao.name}
              {serialNumber && <span className="text-xs text-muted-foreground ml-2">{serialNumber}</span>}
            </Link>
          </CardTitle>
        </div>
        <CardDescription className="flex items-center text-xs">
          <Users className="h-3 w-3 mr-1" /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
          <span className="mx-2">•</span>
          Created {formatDistanceToNow(createdAt, { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {dao.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {dao.tags && dao.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs bg-muted/50">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Gavel className="h-3 w-3 mr-1" />
            {dao.activeProposals} active proposals
          </div>
          <div className="font-medium">
            {dao.treasury.balance.toLocaleString()} {dao.treasury.tokenSymbol}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4">
        {isMember ? (
          <Button asChild variant="outline" className="w-full">
            <Link to={`/dao/${dao.id}`}>
              View DAO
            </Link>
          </Button>
        ) : (
          <Button 
            className="w-full"
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

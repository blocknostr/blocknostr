
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Check, Gavel } from "lucide-react";
import { DAO } from "@/types/dao";
import { formatDistanceToNow } from "date-fns";

interface DAOCardProps {
  dao: DAO;
  isMember: boolean;
  currentUserPubkey: string;
}

const DAOCard: React.FC<DAOCardProps> = ({ dao, isMember, currentUserPubkey }) => {
  const isCreator = dao.creator === currentUserPubkey;
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={dao.image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop"} 
          alt={dao.name} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
        />
        {isMember && (
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-primary/80 hover:bg-primary">
              <Check className="h-3 w-3 mr-1" /> Member
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold hover:text-primary">
            <Link to={`/dao/${dao.id}`} className="hover:underline">
              {dao.name}
            </Link>
          </CardTitle>
        </div>
        <CardDescription className="flex items-center text-xs">
          <Users className="h-3 w-3 mr-1" /> {dao.members.length} members
          <span className="mx-2">•</span>
          Created {formatDistanceToNow(new Date(dao.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {dao.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {dao.tags.map(tag => (
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
        <Button asChild variant={isMember ? "outline" : "default"} className="w-full">
          <Link to={`/dao/${dao.id}`}>
            {isMember ? "View DAO" : "Join DAO"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DAOCard;

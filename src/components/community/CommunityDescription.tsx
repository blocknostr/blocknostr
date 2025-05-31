
import { CalendarIcon, Users, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface CommunityDescriptionProps {
  description: string;
  membersCount: number;
  createdAt: number;
  isPrivate?: boolean;
  onMembersClick?: () => void;
}

const CommunityDescription = ({ 
  description, 
  membersCount, 
  createdAt, 
  isPrivate = false,
  onMembersClick 
}: CommunityDescriptionProps) => {
  return (
    <div className="space-y-3 pt-8">
      <p className="text-sm leading-relaxed">{description}</p>
      
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1.5" />
          {onMembersClick ? (
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
              onClick={onMembersClick}
            >
              {membersCount} {membersCount === 1 ? 'member' : 'members'}
            </Button>
          ) : (
            <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
          )}
        </div>
        
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          <span>Created {formatDistanceToNow(new Date(createdAt * 1000), { addSuffix: true })}</span>
        </div>
        
        {isPrivate && (
          <div className="flex items-center text-amber-600 dark:text-amber-500">
            <Lock className="h-4 w-4 mr-1.5" />
            <span>Private community</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDescription;


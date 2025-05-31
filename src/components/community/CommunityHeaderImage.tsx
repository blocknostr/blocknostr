import { Trash2 } from "lucide-react";
import { getInitials, getRandomColor } from "@/utils/community-utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommunityHeaderImageProps {
  id: string;
  name: string;
  image: string;
  avatar?: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

const CommunityHeaderImage = ({ 
  id, 
  name, 
  image,
  avatar,
  showDeleteButton = false,
  onDelete
}: CommunityHeaderImageProps) => {
  return (
    <div className="relative">
      {/* Banner */}
      <div className={`h-40 ${getRandomColor(id)} flex items-center justify-center rounded-lg overflow-hidden shadow-inner relative`}>
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-5xl font-bold drop-shadow-sm">
            {getInitials(name)}
          </div>
        )}
        
        {showDeleteButton && onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-80 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Avatar overlapping the banner */}
      <div className="absolute left-1/2 top-full transform -translate-x-1/2 -translate-y-3/4">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage 
            src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`} 
            alt={`${name} avatar`} 
          />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default CommunityHeaderImage;


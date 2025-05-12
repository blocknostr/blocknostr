
import { Trash2 } from "lucide-react";
import { getInitials, getRandomColor } from "@/lib/community-utils";
import { Button } from "@/components/ui/button";

interface CommunityHeaderImageProps {
  id: string;
  name: string;
  image: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

const CommunityHeaderImage = ({ 
  id, 
  name, 
  image,
  showDeleteButton = false,
  onDelete
}: CommunityHeaderImageProps) => {
  return (
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
  );
};

export default CommunityHeaderImage;


import { Avatar } from "@/components/ui/avatar";
import { getInitials, getRandomColor } from "@/lib/community-utils";

export interface CommunityCardHeaderProps {
  id: string;
  name: string;
  image: string;
  serialNumber?: number;
}

const CommunityCardHeader = ({ id, name, image, serialNumber }: CommunityCardHeaderProps) => {
  return (
    <div className={`h-24 ${getRandomColor(id)} flex items-center justify-center relative`}>
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-white text-4xl font-bold">
          {getInitials(name)}
        </div>
      )}
      {serialNumber && (
        <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
          {serialNumber}
        </div>
      )}
    </div>
  );
};

export default CommunityCardHeader;

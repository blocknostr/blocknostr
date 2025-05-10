
import { getInitials, getRandomColor } from "@/lib/community-utils";

export interface CommunityCardHeaderProps {
  id: string;
  name: string;
  image: string;
  serialNumber?: number;
}

const CommunityCardHeader = ({ id, name, image }: CommunityCardHeaderProps) => {
  return (
    <div className={`h-28 ${getRandomColor(id)} flex items-center justify-center relative rounded-t-lg overflow-hidden shadow-inner`}>
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
        />
      ) : (
        <div className="text-white text-4xl font-bold drop-shadow-sm">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default CommunityCardHeader;

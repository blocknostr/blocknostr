
import { Avatar } from "@/components/ui/avatar";
import { getInitials, getRandomColor, formatSerialNumber } from "@/lib/community-utils";

export interface CommunityCardHeaderProps {
  id: string;
  name: string;
  image: string;
  serialNumber?: number;
}

const CommunityCardHeader = ({ id, name, image, serialNumber }: CommunityCardHeaderProps) => {
  return (
    <div className={`h-24 ${getRandomColor(id)} flex items-center justify-center relative rounded-t-lg overflow-hidden`}>
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
      {/* Don't display serial number anymore as per user request */}
    </div>
  );
};

export default CommunityCardHeader;


import { getInitials, getRandomColor } from "@/lib/community-utils";

interface CommunityHeaderImageProps {
  id: string;
  name: string;
  image: string;
}

const CommunityHeaderImage = ({ id, name, image }: CommunityHeaderImageProps) => {
  return (
    <div className={`h-32 ${getRandomColor(id)} flex items-center justify-center`}>
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
    </div>
  );
};

export default CommunityHeaderImage;

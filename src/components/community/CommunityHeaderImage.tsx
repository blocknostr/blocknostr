
import { getInitials, getRandomColor } from "@/lib/community-utils";
import { ReactNode } from "react";

interface CommunityHeaderImageProps {
  id: string;
  name: string;
  image: string;
  overlayButton?: ReactNode;
}

const CommunityHeaderImage = ({ id, name, image, overlayButton }: CommunityHeaderImageProps) => {
  return (
    <div className="relative h-40 flex items-center justify-center rounded-lg overflow-hidden">
      <div className={`h-full w-full ${getRandomColor(id)} flex items-center justify-center`}>
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-5xl font-bold">
            {getInitials(name)}
          </div>
        )}
      </div>
      
      {/* Overlay button positioned in the upper right corner */}
      {overlayButton && (
        <div className="absolute top-2 right-2">
          {overlayButton}
        </div>
      )}
    </div>
  );
};

export default CommunityHeaderImage;

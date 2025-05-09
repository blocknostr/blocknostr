
import { Avatar } from "@/components/ui/avatar";

export interface CommunityCardHeaderProps {
  id: string;
  name: string;
  image: string;
  serialNumber?: number;
}

const CommunityCardHeader = ({ id, name, image, serialNumber }: CommunityCardHeaderProps) => {
  const getRandomColor = (str: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500"
    ];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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

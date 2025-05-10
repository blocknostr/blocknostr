
import { Avatar } from "@/components/ui/avatar";
import { getInitials, getRandomColor } from "@/lib/community-utils";

export interface CommunityCardHeaderProps {
  id: string;
  name: string;
  image: string;
  serialNumber?: number;
}

const CommunityCardHeader = ({ id, name, image, serialNumber }: CommunityCardHeaderProps) => {
  // Convert serial number to #aaa000 format (if it exists)
  const formattedSerialNumber = serialNumber ? formatSerialNumber(serialNumber) : null;
  
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
      
      {/* Serial numbers are hidden per requirements */}
    </div>
  );
};

// Function to format serial number as #aaa000 (three letters and three numbers)
const formatSerialNumber = (num: number): string => {
  // Generate three random letters
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let letterPart = '';
  for (let i = 0; i < 3; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Format the number part to be three digits with leading zeros if needed
  const numberPart = String(num % 1000).padStart(3, '0');
  
  return `#${letterPart}${numberPart}`;
};

export default CommunityCardHeader;

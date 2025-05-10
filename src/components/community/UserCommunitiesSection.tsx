
import { Community } from "./CommunityCard";
import CommunityGrid from "./CommunityGrid";
import { Users } from "lucide-react";

interface UserCommunitiesSectionProps {
  communities: Community[];
  currentUserPubkey: string | null;
}

const UserCommunitiesSection = ({ communities, currentUserPubkey }: UserCommunitiesSectionProps) => {
  if (communities.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Your Communities</h2>
        <span className="bg-primary/20 text-primary px-2 py-0.5 text-xs rounded-full ml-2">
          {communities.length}
        </span>
      </div>
      
      <CommunityGrid 
        communities={communities}
        isMemberView={true}
        currentUserPubkey={currentUserPubkey}
      />
    </div>
  );
};

export default UserCommunitiesSection;

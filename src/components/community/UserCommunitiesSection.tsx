
import { Community } from "./CommunityCard";
import CommunityGrid from "./CommunityGrid";

interface UserCommunitiesSectionProps {
  communities: Community[];
  currentUserPubkey: string | null;
}

const UserCommunitiesSection = ({ communities, currentUserPubkey }: UserCommunitiesSectionProps) => {
  if (communities.length === 0) {
    return null;
  }
  
  return (
    <div className="md:col-span-2 lg:col-span-3 mb-4">
      <h2 className="text-lg font-semibold mb-3 border-b pb-2">Your Communities</h2>
      <CommunityGrid 
        communities={communities}
        isMemberView={true}
        currentUserPubkey={currentUserPubkey}
      />
    </div>
  );
};

export default UserCommunitiesSection;

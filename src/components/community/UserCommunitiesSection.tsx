
import { Community } from "./CommunityCard";
import CommunityCard from "./CommunityCard";
import { Users } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

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
      
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 4
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {communities.map(community => (
              <CarouselItem key={community.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <CommunityCard 
                  community={community}
                  isMember={true}
                  currentUserPubkey={currentUserPubkey}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {communities.length > 4 && (
            <>
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4" />
              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
};

export default UserCommunitiesSection;

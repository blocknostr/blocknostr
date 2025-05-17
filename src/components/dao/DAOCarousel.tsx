
import React from "react";
import { DAO } from "@/types/dao";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import DAOCard from "./DAOCard";

interface DAOCarouselProps {
  daos: DAO[];
  currentUserPubkey: string;
}

const DAOCarousel: React.FC<DAOCarouselProps> = ({ daos, currentUserPubkey }) => {
  // No carousel needed if there are no DAOs
  if (daos.length === 0) return null;
  
  return (
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {daos.map((dao) => (
            <CarouselItem key={dao.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
              <DAOCard dao={dao} currentUserPubkey={currentUserPubkey} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-6">
          <CarouselPrevious className="relative static -left-0 translate-y-0 mr-4" />
          <CarouselNext className="relative static -right-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default DAOCarousel;


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
          slidesToScroll: 1
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {daos.map((dao) => (
            <CarouselItem key={dao.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
              <DAOCard dao={dao} currentUserPubkey={currentUserPubkey} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {daos.length > 4 && (
          <>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default DAOCarousel;

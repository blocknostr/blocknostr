
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileQuestion, Info } from "lucide-react";
import { getAddressNFTs, EnrichedToken } from "@/lib/api/alephiumApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils/formatters";

interface NFTGalleryProps {
  address: string;
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ address }) => {
  const [nfts, setNfts] = useState<EnrichedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<EnrichedToken | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;
      
      setIsLoading(true);
      try {
        const nftData = await getAddressNFTs(address);
        setNfts(nftData);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  // Display NFT image with fallback
  const NFTImage = ({ nft }: { nft: EnrichedToken }) => {
    const [imageError, setImageError] = useState(false);
    
    return imageError || !nft.imageUrl ? (
      <div className="h-16 w-full bg-muted flex items-center justify-center rounded-md">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
    ) : (
      <img 
        src={nft.imageUrl} 
        alt={nft.name} 
        className="h-16 w-full object-cover rounded-md"
        onError={() => setImageError(true)} 
      />
    );
  };

  const NFTAttributes = ({ attributes }: { attributes?: any[] }) => {
    if (!attributes || attributes.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 gap-1 mt-3">
        {attributes.slice(0, 4).map((attr, index) => (
          <div key={index} className="bg-muted/50 p-1.5 rounded-md text-xs">
            <div className="font-medium text-muted-foreground text-[10px]">{attr.trait_type || attr.name}</div>
            <div className="truncate">{attr.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const NFTDetailsDialog = () => {
    if (!selectedNFT) return null;
    
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedNFT.name || `NFT ${truncateAddress(selectedNFT.id)}`}</DialogTitle>
          <DialogDescription>ID: {truncateAddress(selectedNFT.id)}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="aspect-square max-h-64 overflow-hidden rounded-lg">
            <NFTImage nft={selectedNFT} />
          </div>
          
          {selectedNFT.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Token ID:</span>
              <div className="font-mono text-xs break-all">{selectedNFT.id}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <div>{selectedNFT.formattedAmount || '1'}</div>
            </div>
          </div>
          
          <NFTAttributes attributes={selectedNFT.attributes} />
          
          <div className="flex justify-end">
            <a 
              href={`https://explorer.alephium.org/tokens/${selectedNFT.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on Explorer
            </a>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="p-2">
      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {nfts.slice(0, 8).map((nft) => (
            <Dialog key={nft.id}>
              <DialogTrigger asChild>
                <div 
                  className="cursor-pointer group relative rounded-md overflow-hidden border bg-card hover:border-primary transition-colors"
                  onClick={() => setSelectedNFT(nft)}
                >
                  <NFTImage nft={nft} />
                  <div className="p-1">
                    <h3 className="font-medium truncate text-[10px]">
                      {nft.name || `NFT ${truncateAddress(nft.id)}`}
                    </h3>
                  </div>
                </div>
              </DialogTrigger>
              <NFTDetailsDialog />
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-20 text-muted-foreground text-xs">
          No NFTs found for this address
        </div>
      )}
    </div>
  );
};

export default NFTGallery;

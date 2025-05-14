
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, Globe } from 'lucide-react';
import UrlRegistry from '@/lib/nostr/utils/media/url-registry';

interface LinkPreviewProps {
  url: string;
  className?: string;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
  isLoading: boolean;
  error?: boolean;
}

export function LinkPreview({ url, className }: LinkPreviewProps) {
  // Check if this URL is already registered as media
  // If it is, we shouldn't render it again
  const [shouldRender, setShouldRender] = useState(true);
  
  // Extract domain from URL for display
  const getDomain = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };
  
  const domain = getDomain(url);
  
  const [metadata, setMetadata] = useState<LinkMetadata>({
    isLoading: true
  });
  
  useEffect(() => {
    // Register this URL with the registry
    if (!UrlRegistry.isUrlRegistered(url)) {
      UrlRegistry.registerUrl(url, 'link');
    } else if (UrlRegistry.getUrlType(url) === 'media') {
      // If it's already registered as media, don't render it
      setShouldRender(false);
      return;
    }
    
    // In a real implementation, we would fetch the metadata from a server
    // For now, we'll simulate the metadata with placeholder data
    const simulateMetadataFetch = async () => {
      try {
        // In a real app, this would be a fetch call to a proxy server
        // that would fetch the OpenGraph metadata from the URL
        // e.g., await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setMetadata({
          title: `Content from ${domain}`,
          description: "This is a placeholder description for the link. In a real implementation, this would be fetched from the page's metadata.",
          siteName: domain,
          isLoading: false
        });
      } catch (error) {
        console.error("Error fetching link metadata:", error);
        setMetadata({
          isLoading: false,
          error: true
        });
      }
    };
    
    simulateMetadataFetch();
  }, [url, domain]);
  
  if (metadata.error || !shouldRender) {
    return null;
  }
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={cn("block no-underline", className)}
    >
      <Card className="overflow-hidden hover:bg-accent/5 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {metadata.favicon ? (
                <img 
                  src={metadata.favicon} 
                  alt={metadata.siteName || domain}
                  className="w-5 h-5"
                />
              ) : (
                <Globe className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-grow min-w-0">
              {metadata.isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium line-clamp-1">
                    {metadata.title || "Untitled Link"}
                  </h4>
                  
                  {metadata.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {metadata.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span>{domain}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

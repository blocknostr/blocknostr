import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Play, Image as ImageIcon, Volume2, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetUserEventsQuery } from '@/api/rtk/eventsApi';
import { getMediaItemsFromEvent } from '@/lib/nostr/utils/media-extraction';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface MediaGridProps {
  pubkey: string;
  limit?: number;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'unknown';
  alt?: string;
  eventId: string;
  timestamp: number;
  content?: string;
}

const MediaGrid: React.FC<MediaGridProps> = React.memo(({
  pubkey,
  limit = 50
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'audio'>('all');

  // RTK Query hook for user events
  const {
    data: userEvents = [],
    isLoading,
    error
  } = useGetUserEventsQuery({
    pubkey,
    limit: limit * 3, // Fetch more to account for filtering
    kinds: [1, 6] // Text notes and reposts that might contain media
  }, {
    skip: !pubkey
  });

  // Extract media items from events
  const mediaItems = useMemo(() => {
    const items: MediaItem[] = [];
    
    userEvents.forEach(event => {
      const mediaFromEvent = getMediaItemsFromEvent(event);
      mediaFromEvent.forEach(media => {
        items.push({
          ...media,
          eventId: event.id,
          timestamp: event.created_at,
          content: event.content
        });
      });
    });

    // Sort by timestamp (newest first)
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [userEvents]);

  // Filter media items
  const filteredMediaItems = useMemo(() => {
    let filtered = mediaItems;
    
    if (filter !== 'all') {
      filtered = mediaItems.filter(item => {
        if (filter === 'images') return item.type === 'image';
        if (filter === 'videos') return item.type === 'video';
        if (filter === 'audio') return item.type === 'audio';
        return true;
      });
    }
    
    return filtered.slice(0, limit);
  }, [mediaItems, filter, limit]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: mediaItems.length,
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    audio: mediaItems.filter(item => item.type === 'audio').length
  }), [mediaItems]);

  // Handle media selection
  const handleMediaSelect = useCallback((media: MediaItem, index: number) => {
    setSelectedMedia(media);
    setCurrentIndex(index);
  }, []);

  // Navigation in lightbox
  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : filteredMediaItems.length - 1;
    setCurrentIndex(newIndex);
    setSelectedMedia(filteredMediaItems[newIndex]);
  }, [currentIndex, filteredMediaItems]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex < filteredMediaItems.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedMedia(filteredMediaItems[newIndex]);
  }, [currentIndex, filteredMediaItems]);

  // Handle download
  const handleDownload = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'media';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download media');
    }
  }, []);

  // Handle external link
  const handleExternalLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Get media type icon
  const getMediaIcon = useCallback((type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-6 w-6" />;
      case 'audio':
        return <Volume2 className="h-6 w-6" />;
      default:
        return <ImageIcon className="h-6 w-6" />;
    }
  }, []);

  // Format timestamp
  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Error loading media</h3>
            <p className="text-muted-foreground">
              Failed to load user events. Please try again.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (filteredMediaItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">No media found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? "This user hasn't shared any media yet."
                : `No ${filter} found.`}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All', count: filterCounts.all },
          { id: 'images', label: 'Images', count: filterCounts.images },
          { id: 'videos', label: 'Videos', count: filterCounts.videos },
          { id: 'audio', label: 'Audio', count: filterCounts.audio }
        ].map(({ id, label, count }) => (
          <Button
            key={id}
            variant={filter === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(id as any)}
            className="flex-shrink-0"
          >
            {label} {count > 0 && <Badge variant="secondary" className="ml-2">{count}</Badge>}
          </Button>
        ))}
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredMediaItems.map((media, index) => (
          <Dialog key={`${media.eventId}-${media.url}`}>
            <DialogTrigger asChild>
              <div
                className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg bg-muted"
                onClick={() => handleMediaSelect(media, index)}
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.alt || 'Media'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-muted-foreground">
                      {getMediaIcon(media.type)}
                    </div>
                  </div>
                )}
                
                {/* Media type indicator */}
                {media.type !== 'image' && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {media.type}
                    </Badge>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
              {selectedMedia && (
                <div className="relative w-full h-full flex">
                  {/* Navigation buttons */}
                  {filteredMediaItems.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                        onClick={handlePrevious}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                        onClick={handleNext}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {/* Media content */}
                  <div className="flex-1 flex items-center justify-center bg-black">
                    {selectedMedia.type === 'image' ? (
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.alt || 'Media'}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : selectedMedia.type === 'video' ? (
                      <video
                        src={selectedMedia.url}
                        controls
                        className="max-w-full max-h-full"
                        autoPlay
                      />
                    ) : selectedMedia.type === 'audio' ? (
                      <div className="flex flex-col items-center gap-4 text-white">
                        <Volume2 className="h-16 w-16" />
                        <audio src={selectedMedia.url} controls className="w-full max-w-md" />
                      </div>
                    ) : (
                      <div className="text-white text-center">
                        <p>Unsupported media type</p>
                        <Button
                          variant="outline"
                          onClick={() => handleExternalLink(selectedMedia.url)}
                          className="mt-4"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in new tab
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Media info sidebar */}
                  <div className="w-80 bg-background border-l p-4 overflow-y-auto">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Media Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="outline">{selectedMedia.type}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span>{formatDate(selectedMedia.timestamp)}</span>
                          </div>
                          {filteredMediaItems.length > 1 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Position:</span>
                              <span>{currentIndex + 1} of {filteredMediaItems.length}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedMedia.content && (
                        <div>
                          <h4 className="font-semibold mb-2">Post Content</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedMedia.content}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(selectedMedia.url)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExternalLink(selectedMedia.url)}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Load more button */}
      {filteredMediaItems.length >= limit && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              // Implement load more logic here
            }}
            disabled={isLoading}
          >
            Load More Media
          </Button>
        </div>
      )}
    </div>
  );
});

MediaGrid.displayName = 'MediaGrid';

export default MediaGrid; 

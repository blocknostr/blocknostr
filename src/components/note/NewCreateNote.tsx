
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewCreateNoteProps {
  className?: string;
}

const NewCreateNote: React.FC<NewCreateNoteProps> = ({ className }) => {
  // Basic state for the note content
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Maximum note length (similar to Twitter)
  const MAX_NOTE_LENGTH = 280;
  
  // Character count calculation
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  const isNearLimit = charsLeft <= 20 && charsLeft > 0;
  const isOverLimit = charsLeft < 0;
  
  // Get user's public key
  const pubkey = nostrService.publicKey;
  
  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(56, textarea.scrollHeight)}px`;
  }, [content]);
  
  // Fetch user profile for avatar
  useEffect(() => {
    if (pubkey) {
      nostrService.getUserProfile(pubkey)
        .then(profile => {
          if (profile) {
            setProfile(profile);
          }
        })
        .catch(err => {
          console.warn("Could not fetch profile", err);
        });
    }
  }, [pubkey]);
  
  // Extract hashtags from content
  const extractHashtags = (text: string): string[] => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return matches.map(tag => tag.substring(1)); // Remove the # symbol
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content || content.trim().length === 0) {
      toast.error("Can't submit an empty post");
      return;
    }
    
    if (isOverLimit) {
      toast.error(`Post is too long (${content.length}/${MAX_NOTE_LENGTH})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Extract hashtags for proper NIP-compliant tagging
      const hashtags = extractHashtags(content);
      const tags = hashtags.map(tag => ["t", tag]);
      
      // Create note with proper tags for NIP compliance
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note kind
        content: content,
        tags: tags
      });
      
      if (eventId) {
        // Clear form on success
        setContent('');
        setIsFocused(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        toast.success('Post published successfully');
      } else {
        toast.error('Failed to publish post');
      }
    } catch (error) {
      console.error('Error publishing note:', error);
      toast.error('Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If user is not logged in
  if (!pubkey) {
    return null;
  }
  
  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardContent className={cn("p-3", isFocused && "pb-4")}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            {/* User avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={profile?.picture} alt={profile?.name || 'User'} />
              <AvatarFallback>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
            
            {/* Note content area */}
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="min-h-[56px] resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base"
                disabled={isSubmitting}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(content.trim().length > 0)}
              />
              
              {/* Action row with character counter and submit button */}
              {(isFocused || content.trim().length > 0) && (
                <div className="flex justify-between items-center pt-2">
                  {/* Character counter */}
                  <div className={cn(
                    "text-xs font-medium",
                    isNearLimit ? "text-amber-500" : 
                    isOverLimit ? "text-red-500" : 
                    "text-muted-foreground"
                  )}>
                    {charsLeft}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Cancel button */}
                    {content.trim().length > 0 && (
                      <Button 
                        type="button" 
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-full"
                        onClick={() => {
                          setContent('');
                          setIsFocused(false);
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Post button */}
                    <Button 
                      type="submit" 
                      size="sm"
                      className="rounded-full px-4 h-9"
                      disabled={isSubmitting || isOverLimit || !content.trim()}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span>Posting...</span>
                        </div>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewCreateNote;

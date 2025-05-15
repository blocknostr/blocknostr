
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lightweightFormatter } from '@/lib/nostr/format/lightweight-formatter';

const SimpleNoteForm: React.FC = () => {
  // Basic state for the note content
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Maximum note length (similar to Twitter/X)
  const MAX_NOTE_LENGTH = 280;
  
  // Character count calculation
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  const isNearLimit = charsLeft <= 20;
  const isOverLimit = charsLeft < 0;
  
  // Get user's public key
  const pubkey = nostrService.publicKey;
  
  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  }, [content]);
  
  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content || content.trim().length === 0) {
      toast.error("Can't submit an empty note");
      return;
    }
    
    if (isOverLimit) {
      toast.error(`Note is too long (${content.length}/${MAX_NOTE_LENGTH})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process content with lightweight formatter for clean text
      const processedContent = lightweightFormatter.processContent(content);
      
      // Create minimal note with content
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note kind
        content: processedContent,
        tags: []
      });
      
      if (eventId) {
        // Clear form on success
        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        toast.success('Note published successfully');
      } else {
        toast.error('Failed to publish note');
      }
    } catch (error) {
      console.error('Error publishing note:', error);
      toast.error('Failed to publish note');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If user is not logged in
  if (!pubkey) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Please log in to create notes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            {/* User avatar */}
            <Avatar className="h-10 w-10">
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
                className="min-h-20 resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base"
                disabled={isSubmitting}
              />
              
              {/* Action row with character counter and submit button */}
              <div className="flex justify-between items-center pt-2">
                {/* Character counter */}
                <div className={cn(
                  "text-xs font-medium",
                  isNearLimit && !isOverLimit ? "text-amber-500" : 
                  isOverLimit ? "text-red-500" : 
                  "text-muted-foreground"
                )}>
                  {charsLeft}
                </div>
                
                {/* Post button */}
                <Button 
                  type="submit" 
                  size="sm"
                  className="rounded-full px-4"
                  disabled={isSubmitting || isOverLimit || !content.trim()}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Posting...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleNoteForm;

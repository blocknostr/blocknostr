import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { usePublishEventMutation } from '@/api/rtk/nostrApi';
import { useAppSelector } from '@/hooks/redux';
import { useProfileMigrated } from '@/hooks/api/useProfileMigrated';
import { coreNostrService } from '@/lib/nostr/core-service';
import { toast } from "@/lib/toast";
import { Send, X, Calendar, Image, Smile, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteFormState } from '@/hooks/useNoteFormState';
import { useNoteSubmission } from '@/hooks/useNoteSubmission';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageIcon, Hash, AtSign, MapPin } from 'lucide-react';

// Enhanced interface with optional advanced features
interface UnifiedCreateNoteProps {
  className?: string;
  variant?: 'simple' | 'advanced' | 'modal';
  showAdvancedFeatures?: boolean;
  autoFocus?: boolean;
  onSuccess?: () => void;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Unified Create Note Component
 * Uses hooks only for all operations - no direct adapter calls
 */
const UnifiedCreateNote: React.FC<UnifiedCreateNoteProps> = ({ 
  className,
  variant = 'simple',
  showAdvancedFeatures = false,
  autoFocus = false,
  onSuccess,
  placeholder = "What's happening?",
  maxLength
}) => {
  // Use hooks for form state and submission
  const {
    content,
    setContent,
    mediaUrls,
    setMediaUrls,
    scheduledDate,
    setScheduledDate,
    textareaRef,
    MAX_NOTE_LENGTH: defaultMaxLength,
    resetForm
  } = useNoteFormState();

  const { isSubmitting, submitNote } = useNoteSubmission();

  // RTK Query mutation for publishing events
  const [publishEvent, { isLoading: isPublishing }] = usePublishEventMutation();

  // Local state for UI behavior
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedFeatures);

  // Get user's public key through service
  const pubkey = coreNostrService.getPublicKey();

  // ✅ RACE-CONDITION-FREE: Use RTK Query hook instead of Redux selector
  const { profile, isLoading: profileLoading } = useProfileMigrated(pubkey);

  // Use custom max length or default
  const effectiveMaxLength = maxLength || defaultMaxLength;
  
  // Character count calculation
  const charsLeft = effectiveMaxLength - content.length;
  const isNearLimit = charsLeft <= 20 && charsLeft > 0;
  const isOverLimit = charsLeft < 0;
  
  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    const newHeight = Math.max(
      variant === 'modal' ? 120 : 56, 
      textarea.scrollHeight
    );
    textarea.style.height = `${newHeight}px`;
  }, [content, variant]);

  // Auto focus for modal variant
  useEffect(() => {
    if ((autoFocus || variant === 'modal') && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, variant]);
  
  // Extract hashtags from content
  const extractHashtags = (text: string): string[] => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return matches.map(tag => tag.substring(1)); // Remove the # symbol
  };

  // Enhanced form submission using hooks only
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!content || content.trim().length === 0) {
      if (variant === 'modal') {
        toast.warning("Can't submit an empty note", {
          description: "Please add some content to your note."
        });
      } else {
        toast.error("Can't submit an empty post");
      }
      return;
    }
    
    if (isOverLimit) {
      const errorMsg = `Note is too long (${content.length}/${effectiveMaxLength})`;
      if (variant === 'advanced') {
        toast.error(errorMsg, {
          description: "Please shorten your note to fit the maximum length."
        });
      } else {
        toast.error(errorMsg);
      }
      return;
    }

    try {
      // Create note with enhanced features
      const hashtags = extractHashtags(content);
      const tags = hashtags.map(tag => ["t", tag]);
      
      const note = {
        kind: 1, // text_note kind
        content,
        tags
      };

      let success = false;

      if (variant === 'advanced' && (scheduledDate || mediaUrls.length > 0)) {
        // Use advanced submission hook for scheduling/media
        success = await submitNote(note, scheduledDate);
      } else {
        // Use RTK Query mutation for simple notes
        await publishEvent(note).unwrap();
        success = true;
      }
      
      if (success) {
        // Reset form on success
        resetForm();
        setIsFocused(false);
        
        // Success messages based on variant
        if (scheduledDate) {
          toast.success("Note scheduled successfully", {
            description: `Your note will be published on ${scheduledDate.toLocaleString()}`
          });
        } else if (variant === 'advanced') {
          toast.success("Note published successfully", {
            description: "Your note is now visible to others."
          });
        } else {
          toast.success('Post published successfully');
        }
        
        // Callback for modal or custom handling
        onSuccess?.();
      } else {
        toast.error('Failed to publish post');
      }
    } catch (error) {
      console.error('Error publishing note:', error);
      if (variant === 'advanced') {
        toast.error("Failed to submit note", {
          description: "Please try again or check your connection."
        });
      } else {
        toast.error('Failed to publish post');
      }
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    resetForm();
    setIsFocused(false);
  };

  // Loading state from either hook or RTK Query
  const isLoadingAny = isSubmitting || isPublishing;

  // Show loading state if no profile data yet
  if (!profile && pubkey) {
    return (
      <Card className={cn("mb-4", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="ml-2 text-sm text-muted-foreground">
              Loading...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine if we should show expanded UI
  const isExpanded = isFocused || content.trim().length > 0 || variant === 'modal' || variant === 'advanced';

  // Card wrapper (conditional for modal variant)
  const CardWrapper = variant === 'modal' ? 'div' : Card;
  const CardContentWrapper = variant === 'modal' ? 'div' : CardContent;

  return (
    <CardWrapper className={cn(
      "transition-all duration-300",
      variant !== 'modal' && "mb-4",
      className
    )}>
      <CardContentWrapper className={cn(
        variant === 'modal' ? "space-y-3" : "p-4",
        variant === 'simple' && "p-3",
        isExpanded && variant === 'simple' && "pb-4"
      )}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            {/* User avatar */}
            <Avatar className={cn(
              "flex-shrink-0",
              variant === 'modal' ? "h-12 w-12" : "h-10 w-10"
            )}>
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
                placeholder={placeholder}
                className={cn(
                  "resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0",
                  variant === 'modal' ? "text-base min-h-[120px]" : "text-base min-h-[56px]",
                  variant === 'simple' && "min-h-[56px]"
                )}
                disabled={isLoadingAny}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(content.trim().length > 0)}
              />
              
              {/* Scheduled date indicator */}
              {scheduledDate && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-md text-xs bg-primary/10 text-primary">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="flex-1">Scheduled for {scheduledDate.toLocaleString()}</span>
                  <button 
                    type="button"
                    onClick={() => setScheduledDate(null)}
                    className="hover:bg-primary/20 rounded-full p-1"
                    aria-label="Cancel scheduled post"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Advanced features toolbar */}
              {(isExpanded && showAdvanced) && (
                <div className="flex items-center gap-1 py-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    disabled={isLoadingAny}
                    title="Add image"
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    disabled={isLoadingAny}
                    title="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    disabled={isLoadingAny}
                    title="Schedule post"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Action row with character counter and submit button */}
              {isExpanded && (
                <div className="flex justify-between items-center pt-2">
                  {/* Character counter */}
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "text-xs font-medium",
                      isNearLimit ? "text-amber-500" : 
                      isOverLimit ? "text-red-500" : 
                      "text-muted-foreground"
                    )}>
                      {charsLeft}
                    </div>
                    
                    {/* Advanced features toggle */}
                    {variant === 'simple' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        title="Toggle advanced features"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Cancel button */}
                    {content.trim().length > 0 && variant !== 'modal' && (
                      <Button 
                        type="button" 
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-full"
                        onClick={handleCancel}
                        disabled={isLoadingAny}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Post button */}
                    <Button 
                      type="submit" 
                      size="sm"
                      className={cn(
                        "rounded-full px-4 h-9",
                        variant === 'modal' && "px-6"
                      )}
                      disabled={isLoadingAny || isOverLimit || !content.trim()}
                    >
                      {isLoadingAny ? (
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span>{scheduledDate ? 'Scheduling...' : 'Posting...'}</span>
                        </div>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {scheduledDate ? 'Schedule' : 'Post'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContentWrapper>
    </CardWrapper>
  );
};

// Export only the main component - removing duplicate aliases
export default UnifiedCreateNote;
export const NewCreateNote = UnifiedCreateNote;


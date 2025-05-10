
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Smile, Bold, Italic, Hash, AtSign, Zap, Globe, Lock, CalendarClock, Eye, Link as LinkIcon, Strikethrough } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaPreview from '../MediaPreview';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EnhancedPostEditorProps {
  content: string;
  setContent: (content: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  maxCharLength: number;
}

const POPULAR_EMOJIS = ["😊", "👍", "🎉", "❤️", "🔥", "😂", "🙏", "✨", "🚀", "💯"];
const ZAP_AMOUNTS = [21, 50, 100, 500, 1000, 5000];

const EnhancedPostEditor = ({
  content,
  setContent,
  onSubmit,
  isSubmitting,
  maxCharLength
}: EnhancedPostEditorProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [zapAmount, setZapAmount] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<"public" | "followers" | "dao">("public");
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const charsLeft = maxCharLength - content.length;
  
  const handleFormatText = (format: 'bold' | 'italic' | 'strikethrough' | 'link') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = "";
    let newCursorPos = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = start + 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        newCursorPos = start + 1;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        newCursorPos = start + 2;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        newCursorPos = end + 3;
        break;
    }
    
    const newContent = 
      content.substring(0, start) + 
      formattedText + 
      content.substring(end);
    
    setContent(newContent);
    
    // Set focus back to textarea and cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + formattedText.length);
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };
  
  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    
    const newContent = 
      content.substring(0, start) + 
      emoji + 
      content.substring(start);
    
    setContent(newContent);
    
    // Set focus back to textarea and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };
  
  const handleInsertTag = (type: 'hashtag' | 'mention') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const prefix = type === 'hashtag' ? '#' : '@';
    
    const newContent = 
      content.substring(0, start) + 
      prefix + 
      content.substring(start);
    
    setContent(newContent);
    
    // Set focus back to textarea and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
    }, 0);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simple file validation
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error("Please upload an image or video file");
      return;
    }
    
    // For this demo we'll just use a URL object to preview the media
    // In a real app, you'd upload to a server and get a URL back
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
    
    toast.success(`${file.type.startsWith('image/') ? 'Image' : 'Video'} uploaded successfully!`);
  };
  
  const handleSchedulePost = () => {
    // Get date 1 hour from now, formatted for datetime-local input
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const defaultDateTime = now.toISOString().slice(0, 16);
    setScheduledDate(scheduledDate || defaultDateTime);
  };
  
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-input bg-background p-4">
        {!showPreview ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="resize-none border-none h-24 focus-visible:ring-0 text-lg p-0"
            maxLength={maxCharLength}
          />
        ) : (
          <div className="min-h-[96px] text-lg whitespace-pre-wrap">
            {/* Simple markdown-like rendering */}
            {content.split('\n').map((line, i) => (
              <div key={i}>
                {line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                  .replace(/\*(.*?)\*/g, '<i>$1</i>')
                  .replace(/~~(.*?)~~/g, '<s>$1</s>')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
                  .replace(/@(\w+)/g, '<span class="text-primary">@$1</span>')
                  .replace(/#(\w+)/g, '<span class="text-primary">#$1</span>')}
              </div>
            ))}
          </div>
        )}
        
        {mediaUrl && (
          <div className="mt-3">
            <div className="relative">
              <MediaPreview url={mediaUrl} />
              <Button 
                size="sm" 
                variant="destructive" 
                className="absolute top-2 right-2 rounded-full h-8 w-8 p-0" 
                onClick={() => setMediaUrl(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
        
        {scheduledDate && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>Scheduled for: {new Date(scheduledDate).toLocaleString()}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 px-1 py-0 text-xs"
              onClick={() => setScheduledDate(null)}
            >
              Cancel
            </Button>
          </div>
        )}
        
        {visibility !== 'public' && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            {visibility === 'followers' ? (
              <Lock className="h-4 w-4" />
            ) : (
              <span className="text-xs">🏛️</span>
            )}
            <span>
              {visibility === 'followers' ? 'Followers only' : 'DAO members only'}
            </span>
          </div>
        )}
        
        {zapAmount && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Attach {zapAmount} sats zap to post</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Media upload */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">Upload media</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          
          {/* Emoji picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Smile className="h-4 w-4" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <Tabs defaultValue="popular">
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="smileys">Smileys</TabsTrigger>
                  <TabsTrigger value="objects">Objects</TabsTrigger>
                </TabsList>
                <TabsContent value="popular" className="mt-0">
                  <div className="grid grid-cols-5 gap-2">
                    {POPULAR_EMOJIS.map(emoji => (
                      <Button 
                        key={emoji} 
                        variant="ghost" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="smileys" className="mt-0">
                  <div className="grid grid-cols-5 gap-2">
                    {["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊"].map(emoji => (
                      <Button 
                        key={emoji} 
                        variant="ghost" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="objects" className="mt-0">
                  <div className="grid grid-cols-5 gap-2">
                    {["🚀", "💻", "📱", "🔥", "⭐", "🎉", "🎈", "🎁", "💡", "🔑"].map(emoji => (
                      <Button 
                        key={emoji} 
                        variant="ghost" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
          
          {/* Formatting options */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleFormatText('bold')}
          >
            <Bold className="h-4 w-4" />
            <span className="sr-only">Bold</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleFormatText('italic')}
          >
            <Italic className="h-4 w-4" />
            <span className="sr-only">Italic</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleFormatText('strikethrough')}
          >
            <Strikethrough className="h-4 w-4" />
            <span className="sr-only">Strikethrough</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleFormatText('link')}
          >
            <LinkIcon className="h-4 w-4" />
            <span className="sr-only">Link</span>
          </Button>
          
          {/* Tagging options */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleInsertTag('hashtag')}
          >
            <Hash className="h-4 w-4" />
            <span className="sr-only">Hashtag</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleInsertTag('mention')}
          >
            <AtSign className="h-4 w-4" />
            <span className="sr-only">Mention</span>
          </Button>
          
          {/* Zap amount */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Zap className="h-4 w-4" />
                <span className="sr-only">Add zap</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <p className="text-sm font-medium mb-2">Attach sats to post</p>
              <div className="grid grid-cols-3 gap-2">
                {ZAP_AMOUNTS.map(amount => (
                  <Button 
                    key={amount} 
                    variant={zapAmount === amount ? "default" : "outline"}
                    size="sm" 
                    className="text-xs"
                    onClick={() => setZapAmount(amount === zapAmount ? null : amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Visibility */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {visibility === 'public' ? (
                  <Globe className="h-4 w-4" />
                ) : visibility === 'followers' ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <span className="text-xs">🏛️</span>
                )}
                <span className="sr-only">Set visibility</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <p className="text-sm font-medium mb-2">Who can see this?</p>
              <div className="space-y-2">
                <Button 
                  variant={visibility === 'public' ? "default" : "outline"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setVisibility('public')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Public
                </Button>
                <Button 
                  variant={visibility === 'followers' ? "default" : "outline"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setVisibility('followers')}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Followers only
                </Button>
                <Button 
                  variant={visibility === 'dao' ? "default" : "outline"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setVisibility('dao')}
                >
                  <span className="mr-2 text-xs">🏛️</span>
                  DAO members only
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Scheduled posting */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <CalendarClock className="h-4 w-4" />
                <span className="sr-only">Schedule post</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <p className="text-sm font-medium mb-2">Schedule for later</p>
              <div className="space-y-2">
                <input 
                  type="datetime-local" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={scheduledDate || ''}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setScheduledDate(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSchedulePost}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Preview */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-full", showPreview && "bg-accent text-accent-foreground")}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Preview</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`text-sm ${charsLeft < 20 ? 'text-amber-500' : charsLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {charsLeft} left
          </div>
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting || content.length === 0 || content.length > maxCharLength}
            className="rounded-full"
          >
            {scheduledDate ? 'Schedule' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPostEditor;

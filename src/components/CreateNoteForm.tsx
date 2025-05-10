import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Image, Smile, Bold, Italic, Strikethrough, Code, Link, Clock, Globe, Lock, Building, Zap } from "lucide-react";
import { EmojiPicker } from "@/components/EmojiPicker"; // Hypothetical emoji picker component
import { MediaPreview } from "@/components/MediaPreview"; // Hypothetical media preview component
import { Autocomplete } from "@/components/Autocomplete"; // Hypothetical autocomplete component
import { DateTimePicker } from "@/components/DateTimePicker"; // Hypothetical date-time picker component
import { cn } from "@/lib/utils";

interface CreateNoteFormProps {
  onNoteCreated?: (event: NostrEvent) => void; // Callback to update MainFeed
}

const CreateNoteForm = ({ onNoteCreated }: CreateNoteFormProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<"public" | "followers" | "dao">("public");
  const [zapAmount, setZapAmount] = useState<number | null>(null);
  const [scheduleTime, setScheduleTime] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const pubkey = nostrService.publicKey;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  const charsLeft = MAX_NOTE_LENGTH - content.length;

  // Handle text input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Apply rich text formatting
  const applyFormatting = (type: "bold" | "italic" | "strikethrough" | "code") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    let formattedText = selectedText;

    switch (type) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "strikethrough":
        formattedText = `~~${selectedText}~~`;
        break;
      case "code":
        formattedText = `\`${selectedText}\``;
        break;
    }

    const newContent = content.slice(0, start) + formattedText + content.slice(end);
    setContent(newContent);
    textarea.focus();
  };

  // Insert link
  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const linkText = `[Link](${url})`;
      const cursorPos = textareaRef.current?.selectionStart || content.length;
      setContent(content.slice(0, cursorPos) + linkText + content.slice(cursorPos));
    }
  };

  // Handle media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setMedia(prev => [...prev, ...Array.from(files).filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"))]);
    }
  };

  // Handle drag-and-drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      setMedia(prev => [...prev, ...Array.from(files).filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"))]);
    }
  };

  // Remove media
  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    setContent(content.slice(0, cursorPos) + emoji + content.slice(cursorPos));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && media.length === 0) {
      toast.error("Please add content or media to post");
      return;
    }

    if (!pubkey) {
      toast.error("Please sign in to post");
      return;
    }

    if (content.length > MAX_NOTE_LENGTH) {
      toast.error(`Content exceeds ${MAX_NOTE_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload media (placeholder logic)
      const mediaUrls = await Promise.all(
        media.map(async file => {
          // TODO: Replace with actual media upload logic (e.g., to CDN or IPFS)
          return URL.createObjectURL(file); // Placeholder
        })
      );

      // Append media URLs to content
      let finalContent = content;
      if (mediaUrls.length > 0) {
        finalContent += "\n" + mediaUrls.join("\n");
      }

      // Prepare Nostr event
      const event: Partial<NostrEvent> = {
        kind: 1,
        content: finalContent,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
      };

      // Add tags for hashtags and mentions
      const hashtags = content.match(/#[\w]+/g)?.map(tag => ["t", tag.slice(1).toLowerCase()]) || [];
      const mentions = content.match(/@[\w]+/g)?.map(mention => ["p", mention.slice(1)]) || [];
      event.tags = [...hashtags, ...mentions];

      // Add visibility tag
      if (visibility !== "public") {
        event.tags.push(["visibility", visibility]);
      }

      // Add Zap amount if specified
      if (zapAmount) {
        event.tags.push(["zap", zapAmount.toString()]);
      }

      // Handle scheduled posting
      if (scheduleTime) {
        event.created_at = Math.floor(scheduleTime.getTime() / 1000);
        await nostrService.scheduleEvent(event as NostrEvent);
        toast.success("Note scheduled!");
      } else {
        const eventId = await nostrService.publishEvent(event);
        if (eventId) {
          toast.success("Note published!");
          onNoteCreated?.({ ...event, id: eventId, pubkey } as NostrEvent);
        }
      }

      // Reset form
      setContent("");
      setMedia([]);
      setZapAmount(null);
      setScheduleTime(null);
      setVisibility("public");
      setShowPreview(false);
    } catch (error) {
      console.error("Failed to publish note:", error);
      toast.error("Failed to publish note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pubkey) {
    return null;
  }

  const avatarFallback = pubkey ? pubkey.substring(0, 2).toUpperCase() : 'N';

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b pb-4 mb-4"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            placeholder="What's happening?"
            className="resize-none border-none h-24 focus-visible:ring-0 text-lg p-0"
            maxLength={MAX_NOTE_LENGTH}
            aria-label="Compose a new post"
            disabled={isSubmitting}
          />
          {media.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {media.map((file, index) => (
                <MediaPreview
                  key={index}
                  file={file}
                  onRemove={() => removeMedia(index)}
                />
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload media"
            >
              <Image size={20} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={handleMediaUpload}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Add emoji">
                  <Smile size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Text formatting options">
                  <Bold size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => applyFormatting("bold")} aria-label="Bold">
                  <Bold size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting("italic")} aria-label="Italic">
                  <Italic size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting("strikethrough")} aria-label="Strikethrough">
                  <Strikethrough size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => applyFormatting("code")} aria-label="Code">
                  <Code size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={insertLink} aria-label="Insert link">
                  <Link size={16} />
                </Button>
              </PopoverContent>
            </Popover>
            <Autocomplete
              content={content}
              onSelect={(value: string) => setContent(content + value)}
              type="tag"
            />
            <Autocomplete
              content={content}
              onSelect={(value: string) => setContent(content + value)}
              type="hashtag"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Add Zap tip">
                  <Zap size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex gap-2">
                  {[10, 50, 100].map(amount => (
                    <Button
                      key={amount}
                      variant={zapAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setZapAmount(amount)}
                    >
                      {amount} sats
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Set visibility">
                  {visibility === "public" && <Globe size={20} />}
                  {visibility === "followers" && <Lock size={20} />}
                  {visibility === "dao" && <Building size={20} />}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={visibility === "public" ? "default" : "outline"}
                    onClick={() => setVisibility("public")}
                  >
                    Public
                  </Button>
                  <Button
                    variant={visibility === "followers" ? "default" : "outline"}
                    onClick={() => setVisibility("followers")}
                  >
                    Followers Only
                  </Button>
                  <Button
                    variant={visibility === "dao" ? "default" : "outline"}
                    onClick={() => setVisibility("dao")}
                  >
                    DAO Members
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Schedule post">
                  <Clock size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <DateTimePicker
                  value={scheduleTime}
                  onChange={setScheduleTime}
                  minDate={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2">
              <div className={`text-sm ${charsLeft < 20 ? 'text-amber-500' : charsLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {charsLeft} characters left
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                aria-label="Toggle preview"
              >
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || (content.length === 0 && media.length === 0) || content.length > MAX_NOTE_LENGTH}
              className="rounded-full"
            >
              {isSubmitting ? "Posting..." : scheduleTime ? "Schedule" : "Post"}
            </Button>
          </div>
          {showPreview && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Preview</h3>
              <div className="prose">
                <p>{content}</p>
                {media.map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt="Preview" className="max-w-full h-auto" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;

import React from 'react';
import { Bold, Italic, Hash, AtSign, Link, Strikethrough } from 'lucide-react';
import { Button } from "@/components/ui/button";
import EmojiPicker from './EmojiPicker';
import MediaUploader from './MediaUploader';
import { Separator } from "@/components/ui/separator";

interface FormatToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onStrikethrough: () => void;
  onLink: () => void;
  onHashtag: () => void;
  onMention: () => void;
  onEmojiSelect: (emoji: string) => void;
  onMediaUpload: (file: File) => void;
}

const FormatToolbar: React.FC<FormatToolbarProps> = ({
  onBold,
  onItalic,
  onStrikethrough,
  onLink,
  onHashtag,
  onMention,
  onEmojiSelect,
  onMediaUpload
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1 py-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={onBold}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
        <span className="sr-only">Bold</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={onItalic}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
        <span className="sr-only">Italic</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={onStrikethrough}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
        <span className="sr-only">Strikethrough</span>
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={onLink}
        title="Insert link"
      >
        <Link className="h-4 w-4" />
        <span className="sr-only">Insert link</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={onHashtag}
        title="Add hashtag"
      >
        <Hash className="h-4 w-4" />
        <span className="sr-only">Add hashtag</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={onMention}
        title="Mention user"
      >
        <AtSign className="h-4 w-4" />
        <span className="sr-only">Mention user</span>
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <EmojiPicker onEmojiSelect={onEmojiSelect} />
      
      <MediaUploader onMediaUpload={onMediaUpload} />
    </div>
  );
};

export default FormatToolbar;

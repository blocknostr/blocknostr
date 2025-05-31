
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Clock, Lock } from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Note } from "./hooks/types";

interface NoteCardProps {
  note: Note;
  onNoteClick: (note: Note) => void;
  onDeleteClick: (noteId: string) => void;
  view: "grid" | "list";
}

const NoteCard = ({ note, onNoteClick, onDeleteClick, view }: NoteCardProps) => {
  const handleCopyContent = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Note content copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy content");
      });
  };

  // Calculate time ago for recent notes
  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "some time ago";
    }
  };

  // Check if note is recent (< 24 hours)
  const isRecentNote = (dateString: string): boolean => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  };

  // Get gradient background for cards based on language
  const getCardGradient = (language: string): string => {
    const gradients: Record<string, string> = {
      javascript: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20",
      typescript: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
      python: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
      go: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/20",
      rust: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
      java: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
      html: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20",
      css: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20",
      text: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20",
    };
    
    return gradients[language.toLowerCase()] || gradients.text;
  };

  const timeAgo = getTimeAgo(note.publishedAt);
  const isRecent = isRecentNote(note.publishedAt);
  const cardGradient = getCardGradient(note.language);
  const isEncrypted = note.encrypted || false;
            
  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden ${cardGradient}`}
      onClick={() => onNoteClick(note)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1">
            {isEncrypted && (
              <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
            )}
            <h3 className="font-medium truncate">
              {note.title}
            </h3>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => handleCopyContent(e, note.content)}
              aria-label="Copy note content"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(note.id);
              }}
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
          <div className="bg-primary/10 text-primary font-medium px-2 py-1 rounded-md">
            {note.language || 'text'}
          </div>
          
          {isEncrypted && (
            <Badge variant="outline" className="py-0 text-xs bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
              Encrypted
            </Badge>
          )}
          
          <div className="flex items-center ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            <span>{timeAgo}</span>
            {isRecent && (
              <Badge variant="outline" className="ml-2 py-0 text-xs bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400">
                New
              </Badge>
            )}
          </div>
        </div>
        
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground border-t pt-2">
          {isEncrypted ? "[Encrypted content]" : note.content}
        </p>
      </CardContent>
    </Card>
  );
};

export default NoteCard;


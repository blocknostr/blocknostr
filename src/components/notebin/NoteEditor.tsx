
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Share, Copy, Link, Eye, EyeOff, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { nostrService } from "@/lib/nostr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "./constants";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./TagInput";
import { NotePreview } from "./NotePreview";
import { useHotkeys } from "./useHotkeys";

interface NoteEditorProps {
  onNoteSaved: (note: any) => void;
}

const NoteEditor = ({ onNoteSaved }: NoteEditorProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Register keyboard shortcuts
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    if (canSave()) handleSave();
  }, [title, content, isSaving]);
  
  useHotkeys('ctrl+p', (e) => {
    e.preventDefault();
    togglePreview();
  }, [previewMode]);

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  const canSave = () => {
    return !isSaving && !!nostrService.publicKey && !!title && !!content;
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setIsSaving(true);

    try {
      // Use NIP-23 long-form content
      const event = {
        kind: 30023,
        content: content,
        tags: [
          ["title", title],
          ["language", language],
          ["published_at", Math.floor(Date.now() / 1000).toString()],
          ["d", `notebin-${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
        ]
      };
      
      // Add user tags to the note
      tags.forEach(tag => {
        event.tags.push(["t", tag]); // Using "t" as per NIP-12 for tags
      });

      const eventId = await nostrService.publishEvent(event);

      if (eventId) {
        setNoteId(eventId);
        toast.success("Note saved successfully!");
        
        // Add the new note to the saved notes
        const newNote = {
          id: eventId,
          title,
          language,
          content,
          tags,
          publishedAt: new Date().toLocaleString(),
          author: nostrService.publicKey,
          event
        };
        
        onNoteSaved(newNote);
      } else {
        throw new Error("Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Content copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  const shareNote = () => {
    if (!noteId) {
      toast.error("You need to save the note first before sharing");
      return;
    }
    
    const shareUrl = `${window.location.origin}/notebin?note=${noteId}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Share link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy share link");
      });
  };

  const clearEditor = () => {
    setTitle("");
    setContent("");
    setLanguage("text");
    setNoteId(null);
    setTags([]);
    setPreviewMode(false);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Note Title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            
            <div className="w-full md:w-48">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TagInput 
            value={tags}
            onChange={setTags}
            placeholder="Add tags..."
            maxTags={5}
          />
          
          <div className="min-h-[300px] border rounded-md">
            {previewMode ? (
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/2 border-r">
                  <CodeEditor
                    value={content}
                    language={language}
                    placeholder="Enter your code or text here..."
                    onChange={(evn) => setContent(evn.target.value)}
                    padding={15}
                    style={{
                      backgroundColor: "var(--background)",
                      fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                      fontSize: 14,
                      height: "100%",
                      minHeight: "300px",
                      width: "100%"
                    }}
                    className="min-h-[300px]"
                  />
                </div>
                <div className="w-full md:w-1/2 p-4 overflow-auto" style={{ minHeight: "300px" }}>
                  <NotePreview content={content} language={language} />
                </div>
              </div>
            ) : (
              <CodeEditor
                value={content}
                language={language}
                placeholder="Enter your code or text here..."
                onChange={(evn) => setContent(evn.target.value)}
                padding={15}
                style={{
                  backgroundColor: "var(--background)",
                  fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                  fontSize: 14,
                  minHeight: "300px",
                  width: "100%"
                }}
                className="min-h-[300px]"
              />
            )}
          </div>
          
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={clearEditor}>
                Clear
              </Button>
              
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              
              <Button variant="outline" onClick={togglePreview}>
                {previewMode ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={shareNote}
                disabled={!noteId}
              >
                <Link className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button 
                onClick={handleSave}
                disabled={!canSave()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            <span>Keyboard shortcuts: </span>
            <kbd className="px-1 py-0.5 text-xs border rounded">Ctrl+S</kbd>
            <span> Save, </span>
            <kbd className="px-1 py-0.5 text-xs border rounded">Ctrl+P</kbd>
            <span> Toggle Preview</span>
          </div>
          
          {!nostrService.publicKey && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              You need to be logged in to save notes.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteEditor;

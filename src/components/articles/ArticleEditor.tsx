import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArticleDraft } from "@/lib/nostr/types/article";
import TagInput from "@/components/articles/TagInput";
import MarkdownRenderer from "@/components/articles/MarkdownRenderer";
import { 
  Save, 
  Send, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link, 
  Image, 
  Heading1, 
  Heading2, 
  Heading3,
  Eye,
  Edit3,
  Keyboard,
  HelpCircle
} from "lucide-react";
import { toast } from "@/lib/toast";

interface ArticleEditorProps {
  draft: ArticleDraft;
  loading?: boolean;
  onSaveDraft: (draft: ArticleDraft) => boolean;
  onPublish: (draft: ArticleDraft) => Promise<boolean>;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  draft,
  loading = false,
  onSaveDraft,
  onPublish
}) => {
  const [currentDraft, setCurrentDraft] = useState<ArticleDraft>(draft);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // ✅ Enhanced markdown toolbar actions
  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentDraft.content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      currentDraft.content.substring(0, start) +
      before + textToInsert + after +
      currentDraft.content.substring(end);

    handleChange("content", newContent);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // ✅ Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**', 'bold text');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*', 'italic text');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('[', '](url)', 'link text');
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'Enter':
          if (e.ctrlKey) {
            e.preventDefault();
            handlePublish();
          }
          break;
      }
    }
  };

  // ✅ FIXED: Only update from props when component first mounts or when not dirty
  useEffect(() => {
    if (!isDirty) {
      setCurrentDraft(draft);
    }
  }, [draft, isDirty]);
  
  // ✅ FIXED: Mark as dirty when user makes changes
  const handleChange = <K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) => {
    setCurrentDraft(prev => ({
      ...prev,
      [key]: value,
      updatedAt: Date.now()
    }));
    setIsDirty(true);
  };
  
  // ✅ FIXED: Reset dirty state after save
  const handleSave = () => {
    const success = onSaveDraft(currentDraft);
    if (success) {
      setLastSaved(new Date());
      setIsDirty(false);
      toast.success("Draft saved!");
    }
  };
  
  const handlePublish = async () => {
    // Validate
    if (!currentDraft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (!currentDraft.content.trim()) {
      toast.error("Content is required");
      return;
    }
    
    const success = await onPublish(currentDraft);
    if (success) {
      setLastSaved(new Date());
      setIsDirty(false);
      toast.success("Article published successfully!");
    } else {
      toast.error("Failed to publish article");
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* ✅ Enhanced Header Section */}
            <div>
              <Input
                placeholder="Article Title"
                value={currentDraft.title}
                onChange={e => handleChange("title", e.target.value)}
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                disabled={loading}
              />
              
              <Input
                placeholder="Subtitle (optional)"
                value={currentDraft.subtitle || ""}
                onChange={e => handleChange("subtitle", e.target.value)}
                className="text-lg text-muted-foreground border-none shadow-none focus-visible:ring-0 px-0 mt-2"
                disabled={loading}
              />
            </div>
            
            <div>
              <Input
                placeholder="Cover Image URL (optional)"
                value={currentDraft.image || ""}
                onChange={e => handleChange("image", e.target.value)}
                className="border rounded-md"
                disabled={loading}
              />
            </div>
            
            <div>
              <Textarea
                placeholder="Summary (optional)"
                value={currentDraft.summary || ""}
                onChange={e => handleChange("summary", e.target.value)}
                className="min-h-20 resize-none"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Tags
              </label>
              <TagInput
                tags={currentDraft.hashtags}
                setTags={(tags) => handleChange("hashtags", tags)}
                disabled={loading}
                placeholder="Add tags (press Enter after each tag)"
              />
            </div>
            
            {/* ✅ Enhanced Editor with Toolbar */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
              <div className="flex items-center justify-between">
                <TabsList className="grid w-auto grid-cols-2">
                  <TabsTrigger value="write" className="flex items-center gap-2">
                    <Edit3 size={16} />
                    Write
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye size={16} />
                    Preview
                  </TabsTrigger>
                </TabsList>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="flex items-center gap-2"
                >
                  <Keyboard size={16} />
                  Shortcuts
                </Button>
              </div>
              
              {/* ✅ Keyboard Shortcuts Help */}
              {showShortcuts && (
                <Card className="mt-4 p-4 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium mb-2">Formatting:</div>
                      <div className="flex justify-between"><span>Bold</span><kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+B</kbd></div>
                      <div className="flex justify-between"><span>Italic</span><kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+I</kbd></div>
                      <div className="flex justify-between"><span>Link</span><kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+K</kbd></div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium mb-2">Actions:</div>
                      <div className="flex justify-between"><span>Save</span><kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+S</kbd></div>
                      <div className="flex justify-between"><span>Publish</span><kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+Enter</kbd></div>
                    </div>
                  </div>
                </Card>
              )}
              
              <TabsContent value="write" className="mt-4">
                {/* ✅ Powerful Markdown Toolbar */}
                <div className="border rounded-t-md p-2 bg-muted/30">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('# ', '', 'Heading 1')}
                      className="h-8 w-8 p-0"
                      title="Heading 1"
                    >
                      <Heading1 size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                      className="h-8 w-8 p-0"
                      title="Heading 2"
                    >
                      <Heading2 size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('### ', '', 'Heading 3')}
                      className="h-8 w-8 p-0"
                      title="Heading 3"
                    >
                      <Heading3 size={16} />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('**', '**', 'bold text')}
                      className="h-8 w-8 p-0"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('*', '*', 'italic text')}
                      className="h-8 w-8 p-0"
                      title="Italic (Ctrl+I)"
                    >
                      <Italic size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('`', '`', 'code')}
                      className="h-8 w-8 p-0"
                      title="Inline Code"
                    >
                      <Code size={16} />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('[', '](url)', 'link text')}
                      className="h-8 w-8 p-0"
                      title="Link (Ctrl+K)"
                    >
                      <Link size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('![', '](image-url)', 'alt text')}
                      className="h-8 w-8 p-0"
                      title="Image"
                    >
                      <Image size={16} />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('- ', '', 'List item')}
                      className="h-8 w-8 p-0"
                      title="Bullet List"
                    >
                      <List size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('1. ', '', 'List item')}
                      className="h-8 w-8 p-0"
                      title="Numbered List"
                    >
                      <ListOrdered size={16} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('> ', '', 'Quote')}
                      className="h-8 w-8 p-0"
                      title="Quote"
                    >
                      <Quote size={16} />
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  ref={textareaRef}
                  placeholder="Write your article content here (Markdown supported)&#10;&#10;Use the toolbar above or keyboard shortcuts:&#10;• Ctrl+B for bold&#10;• Ctrl+I for italic&#10;• Ctrl+K for links&#10;• Ctrl+S to save"
                  value={currentDraft.content}
                  onChange={e => handleChange("content", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[400px] font-mono text-sm rounded-t-none border-t-0 focus:ring-0"
                  disabled={loading}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-md p-6 min-h-[500px] prose dark:prose-invert max-w-none">
                  {currentDraft.content ? (
                    <MarkdownRenderer content={currentDraft.content} />
                  ) : (
                    <div className="text-center text-muted-foreground py-20">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Write some content to see the preview</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* ✅ Enhanced Action Bar */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {lastSaved ? (
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                ) : (
                  <span>Not saved</span>
                )}
                <span>{currentDraft.content.length} characters</span>
                <span>~{Math.ceil(currentDraft.content.length / 1000)} min read</span>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Draft
                </Button>
                
                <Button 
                  onClick={handlePublish}
                  disabled={loading || !currentDraft.title || !currentDraft.content}
                  className="flex items-center gap-2"
                >
                  <Send size={16} />
                  Publish Article
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleEditor;


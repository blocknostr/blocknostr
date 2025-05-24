
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleDraft } from "@/lib/nostr/types/article";
import TagInput from "@/components/articles/TagInput";
import MarkdownRenderer from "@/components/articles/MarkdownRenderer";
import { Save, Send } from "lucide-react";
import { toast } from "sonner";

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
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave();
    }, 30000);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraft]);
  
  useEffect(() => {
    setCurrentDraft(draft);
  }, [draft]);
  
  const handleChange = <K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) => {
    setCurrentDraft(prev => ({
      ...prev,
      [key]: value,
      updatedAt: Date.now()
    }));
    
    // Set a debounce for auto-save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave();
    }, 2000);
    
    setSaveTimeout(timeout);
  };
  
  const handleSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    
    const success = onSaveDraft(currentDraft);
    if (success) {
      setLastSaved(new Date());
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
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
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
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="write" className="mt-4">
                <Textarea
                  placeholder="Write your article content here (Markdown supported)"
                  value={currentDraft.content}
                  onChange={e => handleChange("content", e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  disabled={loading}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-md p-4 min-h-[400px] prose dark:prose-invert max-w-none">
                  <MarkdownRenderer content={currentDraft.content} />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                {lastSaved && (
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                )}
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
                  Publish
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

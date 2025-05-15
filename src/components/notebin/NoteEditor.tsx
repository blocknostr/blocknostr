
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNoteEditorState } from "./editor/useNoteEditorState";
import EditorHeader from "./editor/EditorHeader";
import EditorContent from "./editor/EditorContent";
import EditorActions from "./editor/EditorActions";
import EditorFooter from "./editor/EditorFooter";
import { TagInput } from "./TagInput";

interface NoteEditorProps {
  onNoteSaved: (note: any) => void;
  noteId?: string | null;
  title?: string;
  content?: string;
  language?: string;
  tags?: string[];
}

const NoteEditor = ({ 
  onNoteSaved, 
  noteId = null, 
  title: initialTitle = "", 
  content: initialContent = "", 
  language: initialLanguage = "text", 
  tags: initialTags = [] 
}: NoteEditorProps) => {
  const {
    title,
    setTitle,
    content,
    setContent,
    language,
    setLanguage,
    noteId: internalNoteId,
    tags,
    setTags,
    previewMode,
    isEncrypted,
    toggleEncryption,
    togglePreview,
    canSave,
    handleSave,
    copyToClipboard,
    shareNote,
    clearEditor,
    isLoggedIn,
    setNoteId
  } = useNoteEditorState(onNoteSaved);

  // Set the initial note data when the component mounts or when props change
  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialContent) setContent(initialContent);
    if (initialLanguage) setLanguage(initialLanguage);
    if (initialTags.length > 0) setTags(initialTags);
    if (noteId) setNoteId(noteId);
  }, [initialTitle, initialContent, initialLanguage, initialTags, noteId, setTitle, setContent, setLanguage, setTags, setNoteId]);

  // Log whenever the component renders to help with debugging
  useEffect(() => {
    console.log("NoteEditor mounted with:", { 
      noteId,
      initialTitle,
      initialContent,
      initialLanguage,
      initialTags,
      hasOnNoteSaved: !!onNoteSaved
    });
    return () => console.log("NoteEditor unmounted");
  }, [noteId, initialTitle, initialContent, initialLanguage, initialTags, onNoteSaved]);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <EditorHeader
            title={title}
            setTitle={setTitle}
            language={language}
            setLanguage={setLanguage}
          />
          
          <EditorContent
            content={content}
            setContent={setContent}
            language={language}
            previewMode={previewMode}
          />
          
          <TagInput 
            value={tags}
            onChange={setTags}
            placeholder="Add tags..."
            maxTags={5}
          />
          
          <EditorActions
            canSave={canSave()}
            noteId={internalNoteId || noteId}
            previewMode={previewMode}
            isEncrypted={isEncrypted}
            handleSave={handleSave}
            copyToClipboard={copyToClipboard}
            shareNote={shareNote}
            togglePreview={togglePreview}
            toggleEncryption={toggleEncryption}
            clearEditor={clearEditor}
          />
          
          <EditorFooter isLoggedIn={isLoggedIn} />
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteEditor;

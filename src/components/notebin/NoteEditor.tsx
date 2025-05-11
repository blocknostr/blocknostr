
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
}

const NoteEditor = ({ onNoteSaved }: NoteEditorProps) => {
  const {
    title,
    setTitle,
    content,
    setContent,
    language,
    setLanguage,
    noteId,
    tags,
    setTags,
    previewMode,
    togglePreview,
    canSave,
    handleSave,
    copyToClipboard,
    shareNote,
    clearEditor,
    isLoggedIn,
    summary,
    setSummary,
    image,
    setImage
  } = useNoteEditorState(onNoteSaved);

  // Log whenever the component renders to help with debugging
  useEffect(() => {
    console.log("NoteEditor mounted with onNoteSaved function:", !!onNoteSaved);
    return () => console.log("NoteEditor unmounted");
  }, [onNoteSaved]);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <EditorHeader
            title={title}
            setTitle={setTitle}
            language={language}
            setLanguage={setLanguage}
            summary={summary}
            setSummary={setSummary}
            image={image}
            setImage={setImage}
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
            noteId={noteId}
            previewMode={previewMode}
            handleSave={handleSave}
            copyToClipboard={copyToClipboard}
            shareNote={shareNote}
            togglePreview={togglePreview}
            clearEditor={clearEditor}
          />
          
          <EditorFooter isLoggedIn={isLoggedIn} />
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteEditor;


import React from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { NotePreview } from "../NotePreview";

interface EditorContentProps {
  content: string;
  setContent: (content: string) => void;
  language: string;
  previewMode: boolean;
}

const EditorContent: React.FC<EditorContentProps> = ({
  content,
  setContent,
  language,
  previewMode,
}) => {
  return (
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
  );
};

export default EditorContent;



import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface NotePreviewProps {
  content: string;
  language: string;
  className?: string;
}

export function NotePreview({ content, language, className }: NotePreviewProps) {
  // For markdown, render with ReactMarkdown
  if (language === 'markdown' || language === 'md') {
    return (
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // For HTML, render as HTML (with safety precautions)
  if (language === 'html') {
    return (
      <div className={cn("preview-html", className)}>
        <div className="bg-secondary/30 p-2 mb-2 rounded text-xs">HTML Preview (Limited functionality)</div>
        <iframe
          srcDoc={content}
          title="HTML Preview"
          className="w-full h-full min-h-[250px] border-0"
          sandbox="allow-scripts"
        />
      </div>
    );
  }

  // For JSON, try to pretty-print it
  if (language === 'json') {
    try {
      const parsedJson = JSON.parse(content);
      const prettyJson = JSON.stringify(parsedJson, null, 2);
      return (
        <pre className={cn("p-4 whitespace-pre-wrap break-all overflow-auto", className)}>
          {prettyJson}
        </pre>
      );
    } catch (e) {
      return (
        <pre className={cn("p-4 whitespace-pre-wrap break-all overflow-auto", className)}>
          {content}
          <div className="text-red-500 mt-2">Invalid JSON</div>
        </pre>
      );
    }
  }

  // For all other formats, just display as preformatted text
  return (
    <pre className={cn("p-4 whitespace-pre-wrap break-all overflow-auto", className)}>
      {content}
    </pre>
  );
}


import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "../constants";
import { Textarea } from "@/components/ui/textarea";

interface EditorHeaderProps {
  title: string;
  setTitle: (title: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  summary?: string;
  setSummary?: (summary: string) => void;
  image?: string;
  setImage?: (image: string) => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  setTitle,
  language,
  setLanguage,
  summary = "",
  setSummary,
  image = "",
  setImage
}) => {
  return (
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
      
      {setSummary && (
        <div>
          <Textarea
            placeholder="Summary (optional) - A brief description of this note"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="resize-none h-20"
            maxLength={300}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {summary.length}/300
          </div>
        </div>
      )}
      
      {setImage && (
        <div>
          <Input
            placeholder="Image URL (optional) - Add a header image for your note"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          {image && (
            <div className="mt-2 rounded-md overflow-hidden border h-32 bg-muted/20 flex items-center justify-center">
              <img 
                src={image} 
                alt="Header" 
                className="max-h-32 max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E";
                  e.currentTarget.classList.add("h-8", "w-8", "text-muted-foreground");
                  e.currentTarget.classList.remove("max-h-32", "max-w-full", "object-contain");
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditorHeader;

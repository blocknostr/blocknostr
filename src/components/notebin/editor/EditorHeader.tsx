
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

interface EditorHeaderProps {
  title: string;
  setTitle: (title: string) => void;
  language: string;
  setLanguage: (language: string) => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  setTitle,
  language,
  setLanguage
}) => {
  return (
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
  );
};

export default EditorHeader;


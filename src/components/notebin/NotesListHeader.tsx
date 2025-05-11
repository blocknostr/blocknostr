
import React from "react";
import { FileText } from "lucide-react";

const NotesListHeader = () => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <FileText className="h-5 w-5" />
      <h2 className="text-xl font-semibold">Your Saved Notes</h2>
    </div>
  );
};

export default NotesListHeader;

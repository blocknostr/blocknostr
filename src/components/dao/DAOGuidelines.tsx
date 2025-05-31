
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface DAOGuidelinesProps {
  guidelines: string | undefined;
}

const DAOGuidelines: React.FC<DAOGuidelinesProps> = ({ guidelines }) => {
  if (!guidelines) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
            <p className="text-sm">
              No guidelines have been set for this DAO.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{guidelines}</ReactMarkdown>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DAOGuidelines;


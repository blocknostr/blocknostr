
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";

const WorldChatHeader: React.FC = () => {
  return (
    <CardHeader className="py-2 px-3 border-b">
      <CardTitle className="text-base">World Chat</CardTitle>
    </CardHeader>
  );
};

export default WorldChatHeader;

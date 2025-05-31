import React from "react";
import CreateDAODialog from "@/components/dao/CreateDAODialog";

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCommunity: (name: string, description: string, tags: string[], avatar?: string, banner?: string) => Promise<string | null>;
  children?: React.ReactNode;
}

const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({
  open,
  onOpenChange,
  onCreateCommunity,
  children
}) => {
  return (
    <CreateDAODialog
      open={open}
      onOpenChange={onOpenChange}
      onCreateDAO={onCreateCommunity}
      routePrefix="communities"
    >
      {children}
    </CreateDAODialog>
  );
};

export default CreateCommunityDialog; 

import React from "react";
import NotebinContainer from "@/components/notebin/NotebinContainer";
import NotebinContainerRedux from "@/components/notebin/NotebinContainerRedux";
import { useAppSelector } from "@/hooks/redux";
import { selectUseReduxForNotebin } from "@/store/slices/appSlice";

const NotebinPage: React.FC = () => {
  // Check if we should use Redux for Notebin
  const useReduxForNotebin = useAppSelector(selectUseReduxForNotebin);
  
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {useReduxForNotebin ? <NotebinContainerRedux /> : <NotebinContainer />}
    </div>
  );
};

export default NotebinPage;


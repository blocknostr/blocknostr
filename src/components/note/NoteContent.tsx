
interface NoteContentProps {
  content: string;
}

const NoteContent = ({ content }: NoteContentProps) => {
  return (
    <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{content}</p>
  );
};

export default NoteContent;

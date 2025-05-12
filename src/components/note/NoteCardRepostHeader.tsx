
import { Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NoteCardRepostHeaderProps {
  repostData: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  };
}

const NoteCardRepostHeader = ({ repostData }: NoteCardRepostHeaderProps) => {
  return (
    <div className="px-5 pt-3 pb-1 text-xs text-muted-foreground flex items-center gap-1 bg-muted/50">
      <Repeat className="h-3 w-3" />
      <span>Reposted by </span>
      <Link 
        to={`/profile/${repostData.reposterPubkey}`} 
        className="font-medium hover:underline hover:text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {repostData.reposterProfile?.name || repostData.reposterProfile?.display_name || "Unknown"}
      </Link>
    </div>
  );
};

export default NoteCardRepostHeader;

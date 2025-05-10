
import { Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RepostHeaderProps {
  reposterPubkey: string;
  reposterProfile?: Record<string, any>;
}

const RepostHeader = ({ reposterPubkey, reposterProfile }: RepostHeaderProps) => {
  return (
    <div className="px-5 pt-3 pb-1 text-xs text-muted-foreground flex items-center gap-1 bg-muted/50">
      <Repeat className="h-3 w-3" />
      <span>Reposted by </span>
      <Link 
        to={`/profile/${reposterPubkey}`} 
        className="font-medium hover:underline hover:text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {reposterProfile?.name || reposterProfile?.display_name || "Unknown"}
      </Link>
    </div>
  );
};

export default RepostHeader;

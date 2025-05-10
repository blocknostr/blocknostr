
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ProfileStatsProps {
  followers: string[];
  following: string[];
  postsCount: number;
  relays: number;
  isCurrentUser: boolean;
}

const ProfileStats = ({ followers, following, postsCount, relays, isCurrentUser }: ProfileStatsProps) => {
  const navigate = useNavigate();

  const handleRelayClick = () => {
    if (isCurrentUser) {
      navigate('/settings');
      localStorage.setItem('settingsActiveTab', 'relays');
    }
  };
  
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="grid grid-cols-4 divide-x">
        <StatItem 
          label="Posts" 
          value={postsCount.toLocaleString()} 
        />
        <StatItem 
          label="Following" 
          value={following.length.toLocaleString()} 
        />
        <StatItem 
          label="Followers" 
          value={followers.length.toLocaleString()} 
        />
        <StatItem 
          label="Relays" 
          value={relays.toLocaleString()}
          onClick={isCurrentUser ? handleRelayClick : undefined}
          clickable={isCurrentUser}
        />
      </div>
    </Card>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}

const StatItem = ({ label, value, icon, onClick, clickable }: StatItemProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-4 px-2 transition-colors ${
        clickable ? 'cursor-pointer hover:bg-muted/50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-semibold">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
};

export default ProfileStats;

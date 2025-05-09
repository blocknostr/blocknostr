
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ProfileStatsProps {
  followers: string[];
  following: string[];
  postsCount: number;
}

const ProfileStats = ({ followers, following, postsCount }: ProfileStatsProps) => {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="grid grid-cols-3 divide-x">
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
      </div>
    </Card>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const StatItem = ({ label, value, icon }: StatItemProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-semibold">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
};

export default ProfileStats;

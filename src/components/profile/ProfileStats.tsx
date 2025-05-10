
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, FileText } from "lucide-react";

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
          icon={<FileText className="h-4 w-4 text-primary/80" />}
        />
        <StatItem 
          label="Following" 
          value={following.length.toLocaleString()} 
          icon={<Users className="h-4 w-4 text-primary/80" />}
        />
        <StatItem 
          label="Followers" 
          value={followers.length.toLocaleString()} 
          icon={<Users className="h-4 w-4 text-primary/80" />}
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

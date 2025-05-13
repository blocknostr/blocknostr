
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, Radio, PackagePlus } from "lucide-react";

interface MyCubeStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  relaysCount: number;
}

const MyCubeStats = ({ postsCount, followersCount, followingCount, relaysCount }: MyCubeStatsProps) => {
  const statsItems = [
    {
      label: "Posts",
      value: postsCount,
      icon: MessageCircle,
      color: "text-blue-500"
    },
    {
      label: "Followers",
      value: followersCount,
      icon: Users,
      color: "text-green-500"
    },
    {
      label: "Following",
      value: followingCount,
      icon: PackagePlus,
      color: "text-purple-500"
    },
    {
      label: "Relays",
      value: relaysCount,
      icon: Radio,
      color: "text-amber-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsItems.map((item) => (
        <Card key={item.label} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center p-4">
              <div className={`${item.color} mb-2 rounded-full p-2 bg-muted`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase">{item.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyCubeStats;

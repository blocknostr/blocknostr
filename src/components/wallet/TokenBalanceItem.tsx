
import { TokenBalance } from "@/lib/alephium";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TokenBalanceItemProps {
  token: TokenBalance;
}

const TokenBalanceItem = ({ token }: TokenBalanceItemProps) => {
  const { symbol, name, balance, logo } = token;
  
  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={logo} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-sm font-medium">{symbol}</div>
          <div className="text-xs text-muted-foreground">{name}</div>
        </div>
      </div>
      <div className="text-sm font-medium">{balance}</div>
    </div>
  );
};

export default TokenBalanceItem;

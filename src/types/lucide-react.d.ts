
declare module 'lucide-react' {
  import React from 'react';

  export interface LucideProps extends React.SVGAttributes<SVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    class?: string;
    className?: string;
  }

  // Export all icons from lucide-react
  export type LucideIcon = React.FC<LucideProps>;
  
  // Sample exports
  export const Home: LucideIcon;
  export const Bell: LucideIcon;
  export const Mail: LucideIcon;
  export const Users: LucideIcon;
  export const Settings: LucideIcon;
  export const FileText: LucideIcon;
  export const Wallet: LucideIcon;
  export const Crown: LucideIcon;
  export const BookOpen: LucideIcon;
  export const UserRound: LucideIcon;
  export const MessageSquarePlus: LucideIcon;
  export const GamepadIcon: LucideIcon;
  export const Loader2: LucideIcon;
  export const Clipboard: LucideIcon;
  export const Check: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const RefreshCw: LucideIcon;
  
  // Additional icons needed for the profile page
  export const User: LucideIcon;
  export const Edit: LucideIcon;
  export const Link: LucideIcon;
  export const Calendar: LucideIcon;
  export const MapPin: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  
  // Icons needed for other components
  export const SmilePlus: LucideIcon;
  export const SendHorizontal: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const UserCheck: LucideIcon;
  export const HistoryIcon: LucideIcon;
  export const RefreshCcwIcon: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Search: LucideIcon;
  export const Menu: LucideIcon;
  export const LogOut: LucideIcon;
  export const Shield: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const Pencil: LucideIcon;
  export const Trash: LucideIcon;
  export const Save: LucideIcon;
  export const Send: LucideIcon;
  export const X: LucideIcon;
  export const LockOpen: LucideIcon;
  export const KeyRound: LucideIcon;
  export const QrCode: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const LogIn: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserMinus: LucideIcon;
  export const CalendarIcon: LucideIcon;
  export const Lock: LucideIcon;
  export const Trash2: LucideIcon;
  export const Copy: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Plus: LucideIcon;
  export const ListOrdered: LucideIcon;
  export const Compass: LucideIcon;
  export const Heart: LucideIcon;
  export const FileQuestion: LucideIcon;
  export const Smile: LucideIcon;
  export const Fingerprint: LucideIcon;
}

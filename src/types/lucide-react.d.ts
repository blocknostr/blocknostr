
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
  
  // Base icons used in the profile page and edit dialog
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
  
  // Profile page & editor icons
  export const User: LucideIcon;
  export const Edit: LucideIcon;
  export const Link: LucideIcon;
  export const Calendar: LucideIcon;
  export const MapPin: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  
  // Additional icons needed for other components
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
  
  // Additional icons that were causing errors in other components
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Reply: LucideIcon;
  export const Repeat: LucideIcon;
  export const Share: LucideIcon;
  export const Share2: LucideIcon;
  export const Twitter: LucideIcon;
  export const Flag: LucideIcon;
  export const BellOff: LucideIcon;
  export const UserX: LucideIcon;
  export const Grid2X2: LucideIcon;
  export const List: LucideIcon;
  export const Eye: LucideIcon;
  export const FileCode: LucideIcon;
  export const Unlock: LucideIcon;
  export const Bold: LucideIcon;
  export const Italic: LucideIcon;
  export const Quote: LucideIcon;
  export const Image: LucideIcon;
  export const Clock: LucideIcon;
  export const Hash: LucideIcon;
  export const Zap: LucideIcon;
  export const Upload: LucideIcon;
  export const BadgePercent: LucideIcon;
  export const Network: LucideIcon;
  export const XCircle: LucideIcon;
  export const Info: LucideIcon;
  export const Github: LucideIcon;
  export const Hourglass: LucideIcon;
  export const Globe: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const FileVideo: LucideIcon;
  export const Paperclip: LucideIcon;
  export const ArrowUpDown: LucideIcon;
  export const ArrowDownNarrowWide: LucideIcon;
  export const ArrowUpNarrowWide: LucideIcon;
  export const SortAsc: LucideIcon;
  export const SortDesc: LucideIcon;
  export const Tags: LucideIcon;
}


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
}

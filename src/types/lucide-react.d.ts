
declare module 'lucide-react' {
  import { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

  export type LucideProps = SVGProps<SVGSVGElement> & { size?: string | number };
  export type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  
  // Define common icons
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
  export const CheckCircle2: LucideIcon;
}

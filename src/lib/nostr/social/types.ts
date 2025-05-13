
import { EventManager } from '../event';
import { UserManager } from '../user';

export interface SocialManagerOptions {
  cacheExpiration?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
  eventManager?: EventManager;
  userManager?: UserManager;
  [key: string]: any;
}

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  userHasLiked?: boolean;
  userHasReposted?: boolean;
  userHasZapped?: boolean;
  likers?: string[];
  reposters?: string[];
  zappers?: string[];
}

export interface ContactList {
  following: string[];
  followers: string[];
  muted: string[];
  blocked: string[];
  pubkeys: string[];
}

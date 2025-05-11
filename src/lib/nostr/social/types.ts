
export interface ReactionCounts {
  likes: number;
  reposts: number;
  userHasLiked: boolean;
  userHasReposted: boolean;
  likers: string[];
}

export interface ContactList {
  pubkeys: string[];
  tags: string[][];
  content: string;
}

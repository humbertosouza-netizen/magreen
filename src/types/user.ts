export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  instagram?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  banned: boolean;
  banned_reason?: string;
  last_login?: string;
}

export interface UserStats {
  total_articles: number;
  total_comments: number;
  last_activity?: string;
} 
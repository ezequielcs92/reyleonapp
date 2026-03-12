export interface UserProfile {
  uid: string;
  email: string; // from Auth
  fullName: string;
  stageName?: string;
  photoUrl?: string; // from Auth or Storage
  bio?: string;
  roleInShow?: string; // e.g., "Simba", "Ensemble"
  roles: string[]; // e.g., ["Actor", "Dancer"]
  skills: string[]; // e.g., ["Singing", "Acrobatics"]
  createdAt: string; // ISO string
  updatedAt: string;
  birthdate?: string;
}

export interface UserLink {
  id: string;
  type: 'instagram' | 'tiktok' | 'twitter' | 'youtube' | 'website' | 'other';
  label: string;
  url: string;
}

export interface UserWork {
  id: string;
  title: string;
  year: number;
  company: string;
  role: string;
  link?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string; // Denormalized for ease
  authorPhotoUrl?: string; // Denormalized indicating avatar
  imageUrl?: string;
  description: string;
  likesCount: number;
  pinned: boolean;
  createdAt: string; // ISO or Timestamp
}

export interface Poll {
  id: string;
  creatorId: string;
  creatorName: string;
  question: string;
  type: 'single' | 'multi';
  isAnonymous: boolean;
  showResults: 'always' | 'after_vote' | 'after_close';
  closesAt?: string;
  pinned: boolean;
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votesCount: number; // Denormalized counter
}

export interface Business {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  category: string;
  tags: string[];
  shortDesc: string;
  longDesc?: string;
  imageUrl?: string;
  location?: string;
  status: 'active' | 'hidden_by_admin' | 'closed';
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  type: string;
  createdAt: string;
}

export interface BirthdayEvent {
  id: string;
  fullName: string;
  birthdate: string;
  photoUrl?: string | null;
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'post_pinned' | 'poll_pinned' | 'event_created' | 'birthday';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface AdminFeedAction {
  id: string;
  kind: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete';
  title: string;
  createdAt: string;
  adminName: string;
}

export interface InfoLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
  orderIndex: number;
  createdAt: string;
}

// DB row shapes (snake_case) used directly by Supabase queries in pages/components.
export interface DbCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  type: string;
  created_at: string;
}

export interface DbBirthdayEvent {
  id: string;
  full_name: string;
  birthdate: string;
  photo_url?: string | null;
}

export interface DbPostComment {
  id: string;
  user_id: string;
  user_name: string;
  user_photo_url: string | null;
  content: string;
  created_at: string;
}

export interface DbPostCommentPreview {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface DbNotificationItem {
  id: string;
  type: 'post_pinned' | 'poll_pinned' | 'event_created' | 'birthday';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface DbInfoLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DbAdminFeedAction {
  id: string;
  kind: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete';
  title: string;
  created_at: string;
  adminName: string;
}

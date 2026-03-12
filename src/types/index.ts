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

// Core database types
export type MembershipType = 'free' | 'premium';
export type PostType = 'article' | 'lesson';
export type PostStatus = 'draft' | 'published' | 'archived';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SessionType = 'call' | 'video' | 'in-person';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  membership_type: MembershipType;
  membership_expires_at?: string;
  subscription_plan?: '1month' | '3months' | '1year' | null;
  subscription_start?: string | null;
  subscription_end?: string | null;
  bio?: string;
  website?: string;
  twitter_handle?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  type: PostType;
  status: PostStatus;
  is_premium: boolean;
  author_id: string;
  featured_image_url?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  comments_count?: number;
}

export interface Comment {
  id: string;
  content: string;
  post_id?: string;
  author_id: string;
  parent_id?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  replies?: Comment[];
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  replies_count?: number;
  latest_reply?: ThreadReply;
}

export interface ThreadReply {
  id: string;
  content: string;
  thread_id: string;
  author_id: string;
  created_at: string;
  // Joined fields
  author?: Profile;
}

export interface MentorshipBooking {
  id: string;
  mentee_id: string;
  mentor_id: string;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  // Joined fields
  mentee?: Profile;
  mentor?: Profile;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  room_name: string;
  created_at: string;
  // Joined fields
  sender?: Profile;
}

export interface EconomicEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  importance: 'low' | 'medium' | 'high';
  currency?: string;
  country?: string;
  actual_value?: string;
  forecast_value?: string;
  previous_value?: string;
  created_at: string;
}

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  created_at: string;
}

// UI Component types
export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<any>;
  current?: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface PostFormData {
  title: string;
  content: string;
  excerpt?: string;
  type: PostType;
  is_premium: boolean;
  tags?: string[];
  featured_image_url?: string;
  metadata?: Record<string, any>;
}

export interface CommentFormData {
  content: string;
  parent_id?: string;
}

export interface BookingFormData {
  mentor_id: string;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
}

// Removed: Signal specific types

// Dashboard types
export interface DashboardStats {
  total_posts: number;
  total_comments: number;
  total_bookings: number;
  upcoming_bookings: number;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Admin role types
export interface AdminRole {
  id: string;
  user_id: string;
  role_name: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: Profile;
}

export interface AdminPermission {
  manage_users: boolean;
  manage_posts: boolean;
  manage_videos: boolean;
  manage_settings: boolean;
  view_analytics: boolean;
}


// Database type definitions for Supabase tables
// These types should match the SQL schema exactly

export interface User {
  id: string; // UUID
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  account_type?: 'artist' | 'organization';
  active_organization_id?: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface IndividualProfile {
  id: string; // UUID
  user_id: string; // UUID, FK to users
  
  // Basic profile information
  stage_name: string | null;
  bio: string | null;
  headliner: string | null;
  location: string | null;
  website_url: string | null;
  
  // Professional information
  primary_instrument: string | null;
  instruments: string[] | null;
  genres: string[] | null;
  years_experience: number | null;
  
  // Performance preferences
  looking_for_gigs: boolean;
  available_for_hire: boolean;
  travel_distance_km: number | null;
  base_rate_per_hour: number | null; // Decimal
  
  // Contact preferences
  preferred_contact_method: 'email' | 'phone' | 'app' | null;
  phone_number: string | null;
  
  // Social media links
  social_links: Record<string, string>; // JSONB
  
  // Performance history and ratings
  total_performances: number;
  average_rating: number; // Decimal
  
  // Availability calendar
  availability: Record<string, any>; // JSONB
  
  // Profile completion and verification
  profile_complete: boolean;
  verified: boolean;
  verification_date: string | null; // ISO timestamp
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface FeaturedPerformance {
  id: string; // UUID
  user_id: string; // UUID, FK to individual_profiles.user_id
  
  // Performance details
  title: string;
  description: string | null;
  youtube_url: string | null;
  thumbnail_url: string | null;
  
  // Organization
  display_order: number;
  is_active: boolean;
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ExperienceEntry {
  id: string; // UUID
  user_id: string; // UUID, FK to individual_profiles.user_id
  
  // Experience details
  title: string;
  organization: string;
  description: string | null;
  
  // Dates
  start_date: string | null; // ISO date
  end_date: string | null; // ISO date
  is_current: boolean;
  
  // Organization
  display_order: number;
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface PastPerformance {
  id: string; // UUID
  user_id: string; // UUID, FK to individual_profiles.user_id
  
  // Performance details
  title: string;
  venue: string | null;
  role: string | null;
  performance_date: string | null; // ISO date
  description: string | null;
  
  // Additional info
  ensemble_size: number | null;
  genre: string | null;
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export type OrganizationType = 
  | 'venue'
  | 'ensemble' 
  | 'orchestra'
  | 'band'
  | 'choir'
  | 'music_school'
  | 'record_label'
  | 'event_organizer'
  | 'other';

export interface OrganizationProfile {
  id: string; // UUID
  
  // Basic organization information
  name: string;
  description: string | null;
  organization_type: OrganizationType;
  
  // Location and contact information
  address: string | null;
  city: string | null;
  state_province: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null; // Decimal
  longitude: number | null; // Decimal
  phone_number: string | null;
  email: string | null;
  website_url: string | null;
  
  // Organization details
  established_year: number | null;
  capacity: number | null;
  genres: string[] | null;
  
  // Business information
  business_registration_number: string | null;
  tax_id: string | null;
  
  // Venue-specific fields
  venue_type: string | null;
  amenities: string[] | null;
  equipment_provided: string[] | null;
  sound_system_available: boolean;
  lighting_system_available: boolean;
  
  // Ensemble-specific fields
  ensemble_size: number | null;
  primary_repertoire: string[] | null;
  rehearsal_schedule: Record<string, any>; // JSONB
  
  // Booking and hiring information
  accepts_bookings: boolean;
  hiring_musicians: boolean;
  booking_lead_time_days: number;
  base_rental_rate_per_hour: number | null; // Decimal
  base_performance_fee: number | null; // Decimal
  
  // Contact preferences
  preferred_contact_method: 'email' | 'phone' | 'app' | null;
  
  // Social media and marketing
  social_links: Record<string, string>; // JSONB
  logo_url: string | null;
  banner_image_url: string | null;
  gallery_images: string[] | null;
  
  // Performance history and ratings
  total_events: number;
  average_rating: number; // Decimal
  
  // Organization status
  verified: boolean;
  verification_date: string | null; // ISO timestamp
  active: boolean;
  
  // Availability and scheduling
  operating_hours: Record<string, any>; // JSONB
  availability: Record<string, any>; // JSONB
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export type AdminRole = 'owner' | 'admin' | 'manager' | 'editor';

export interface OrgAdmin {
  id: string; // UUID
  user_id: string; // UUID, FK to users
  organization_id: string; // UUID, FK to organization_profiles
  
  // Admin role and permissions
  role: AdminRole;
  permissions: Record<string, any>; // JSONB
  
  // Admin status
  is_active: boolean;
  invited_by: string | null; // UUID, FK to users
  invitation_accepted: boolean;
  invitation_token: string; // UUID
  invitation_expires_at: string | null; // ISO timestamp
  
  // Admin activity
  last_activity_at: string; // ISO timestamp
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Content Tables
export type PostType = 'general' | 'performance' | 'announcement' | 'collaboration' | 'opportunity' | 'review' | 'event';
export type PostVisibility = 'public' | 'followers' | 'private' | 'organization';

export interface Post {
  id: string; // UUID
  
  // Author information
  user_id: string | null; // UUID, FK to users
  organization_id: string | null; // UUID, FK to organization_profiles
  
  // Post content
  content: string | null;
  title: string | null;
  
  // Media attachments
  media_urls: string[] | null;
  media_types: string[] | null;
  media_metadata: Record<string, any>; // JSONB
  
  // Post type and categorization
  post_type: PostType;
  tags: string[] | null;
  
  // Location information
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Performance/Event specific fields
  event_date: string | null; // ISO timestamp
  venue_name: string | null;
  ticket_url: string | null;
  
  // Collaboration specific fields
  collaboration_type: string | null;
  instruments_needed: string[] | null;
  genres: string[] | null;
  compensation_offered: string | null;
  
  // Post visibility and settings
  visibility: PostVisibility;
  allow_comments: boolean;
  allow_shares: boolean;
  
  // Engagement metrics
  likes_count: number;
  comments_count: number;
  shares_count: number;
  
  // Content moderation
  is_flagged: boolean;
  flagged_reason: string | null;
  moderator_id: string | null; // UUID, FK to users
  moderated_at: string | null; // ISO timestamp
  
  // Post status
  is_published: boolean;
  is_pinned: boolean;
  
  // SEO and discovery
  excerpt: string | null;
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  published_at: string | null; // ISO timestamp
}

export type GigType = 'one_time' | 'recurring' | 'residency' | 'tour' | 'session' | 'teaching' | 'other';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'any';
export type CompensationType = 'paid' | 'volunteer' | 'profit_share' | 'exposure' | 'other';
export type PayRateType = 'hourly' | 'daily' | 'per_gig' | 'flat_fee' | 'percentage';
export type ApplicationMethod = 'email' | 'phone' | 'website' | 'in_app' | 'audition';
export type GigStatus = 'draft' | 'open' | 'closed' | 'filled' | 'cancelled';

export interface Gig {
  id: string; // UUID
  
  // Poster information
  posted_by_user_id: string | null; // UUID, FK to users
  posted_by_organization_id: string | null; // UUID, FK to organization_profiles
  
  // Basic gig information
  title: string;
  description: string;
  gig_type: GigType;
  
  // Performance details
  instruments_needed: string[];
  genres: string[] | null;
  experience_level: ExperienceLevel | null;
  ensemble_size_min: number | null;
  ensemble_size_max: number | null;
  
  // Location and venue information
  venue_name: string | null;
  venue_address: string | null;
  city: string;
  state_province: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_remote: boolean;
  travel_required: boolean;
  travel_distance_km: number | null;
  
  // Date and time information
  start_date: string; // Date
  end_date: string | null; // Date
  start_time: string | null; // Time
  end_time: string | null; // Time
  rehearsal_dates: string[] | null; // Date array
  application_deadline: string | null; // Date
  
  // Compensation and payment
  compensation_type: CompensationType;
  pay_rate_type: PayRateType | null;
  pay_amount_min: number | null;
  pay_amount_max: number | null;
  currency: string;
  payment_terms: string | null;
  additional_benefits: string | null;
  
  // Requirements and qualifications
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  equipment_provided: string[] | null;
  equipment_required: string[] | null;
  dress_code: string | null;
  age_requirements: string | null;
  
  // Application process
  application_method: ApplicationMethod;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  audition_required: boolean;
  audition_details: string | null;
  portfolio_required: boolean;
  
  // Gig status and management
  status: GigStatus;
  applications_count: number;
  max_applications: number | null;
  featured: boolean;
  urgent: boolean;
  
  // Additional details
  special_requirements: string | null;
  notes: string | null;
  tags: string[] | null;
  
  // Media attachments
  images: string[] | null;
  attachments: string[] | null;
  
  // SEO and discovery
  excerpt: string | null;
  
  // Moderation
  is_flagged: boolean;
  flagged_reason: string | null;
  moderator_id: string | null; // UUID, FK to users
  moderated_at: string | null; // ISO timestamp
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  published_at: string | null; // ISO timestamp
  expires_at: string | null; // ISO timestamp
}

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';

export interface PostLike {
  id: string; // UUID
  user_id: string; // UUID, FK to users
  post_id: string; // UUID, FK to posts
  reaction_type: ReactionType;
  created_at: string; // ISO timestamp
}

export interface PostComment {
  id: string; // UUID
  user_id: string; // UUID, FK to users
  post_id: string; // UUID, FK to posts
  parent_comment_id: string | null; // UUID, FK to post_comments
  content: string;
  is_edited: boolean;
  edit_count: number;
  likes_count: number;
  replies_count: number;
  is_flagged: boolean;
  flagged_reason: string | null;
  moderator_id: string | null; // UUID, FK to users
  moderated_at: string | null; // ISO timestamp
  is_deleted: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export type FollowStatus = 'active' | 'blocked' | 'muted';
export type FollowType = 'follow' | 'close_friend' | 'collaborator';

export interface Follow {
  id: string; // UUID
  follower_user_id: string; // UUID, FK to users
  followed_user_id: string | null; // UUID, FK to users
  followed_organization_id: string | null; // UUID, FK to organization_profiles
  status: FollowStatus;
  follow_type: FollowType;
  is_mutual: boolean;
  notifications_enabled: boolean;
  notification_types: Record<string, boolean>; // JSONB
  is_public: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Database response types (what you get from Supabase queries)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
          id: string;
        };
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      individual_profiles: {
        Row: IndividualProfile;
        Insert: Omit<IndividualProfile, 'id' | 'created_at' | 'updated_at' | 'total_performances' | 'average_rating' | 'profile_complete' | 'verified'>;
        Update: Partial<Omit<IndividualProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      organization_profiles: {
        Row: OrganizationProfile;
        Insert: Omit<OrganizationProfile, 'id' | 'created_at' | 'updated_at' | 'total_events' | 'average_rating' | 'verified' | 'active'>;
        Update: Partial<Omit<OrganizationProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      org_admins: {
        Row: OrgAdmin;
        Insert: Omit<OrgAdmin, 'id' | 'created_at' | 'updated_at' | 'invitation_token'>;
        Update: Partial<Omit<OrgAdmin, 'id' | 'created_at' | 'updated_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count' | 'shares_count'>;
        Update: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>;
      };
      gigs: {
        Row: Gig;
        Insert: Omit<Gig, 'id' | 'created_at' | 'updated_at' | 'applications_count'>;
        Update: Partial<Omit<Gig, 'id' | 'created_at' | 'updated_at'>>;
      };
      post_likes: {
        Row: PostLike;
        Insert: Omit<PostLike, 'id' | 'created_at'>;
        Update: Partial<Omit<PostLike, 'id' | 'created_at'>>;
      };
      post_comments: {
        Row: PostComment;
        Insert: Omit<PostComment, 'id' | 'created_at' | 'updated_at' | 'is_edited' | 'edit_count' | 'likes_count' | 'replies_count'>;
        Update: Partial<Omit<PostComment, 'id' | 'created_at' | 'updated_at'>>;
      };
      follows: {
        Row: Follow;
        Insert: Omit<Follow, 'id' | 'created_at' | 'updated_at' | 'is_mutual'>;
        Update: Partial<Omit<Follow, 'id' | 'created_at' | 'updated_at'>>;
      };
      featured_performances: {
        Row: FeaturedPerformance;
        Insert: Omit<FeaturedPerformance, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FeaturedPerformance, 'id' | 'created_at' | 'updated_at'>>;
      };
      experience_entries: {
        Row: ExperienceEntry;
        Insert: Omit<ExperienceEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ExperienceEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
      past_performances: {
        Row: PastPerformance;
        Insert: Omit<PastPerformance, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PastPerformance, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Functions: {
      is_organization_admin: {
        Args: { org_id: string; user_id?: string };
        Returns: boolean;
      };
      get_user_org_role: {
        Args: { org_id: string; user_id?: string };
        Returns: string;
      };
      get_user_post_like: {
        Args: { p_post_id: string; p_user_id?: string };
        Returns: string;
      };
      toggle_post_like: {
        Args: { p_post_id: string; p_reaction_type?: string };
        Returns: boolean;
      };
      is_following_user: {
        Args: { target_user_id: string; current_user_id?: string };
        Returns: boolean;
      };
      is_following_organization: {
        Args: { target_org_id: string; current_user_id?: string };
        Returns: boolean;
      };
      get_user_follower_count: {
        Args: { target_user_id: string };
        Returns: number;
      };
      get_user_following_count: {
        Args: { target_user_id: string };
        Returns: number;
      };
      get_organization_follower_count: {
        Args: { target_org_id: string };
        Returns: number;
      };
      toggle_follow_user: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      toggle_follow_organization: {
        Args: { target_org_id: string };
        Returns: boolean;
      };
      get_user_feed: {
        Args: { p_user_id?: string; p_limit?: number; p_offset?: number };
        Returns: Array<{
          id: string;
          user_id: string | null;
          organization_id: string | null;
          content: string | null;
          title: string | null;
          post_type: string;
          visibility: string;
          likes_count: number;
          comments_count: number;
          created_at: string;
          is_liked: boolean;
        }>;
      };
      get_post_comments_tree: {
        Args: { p_post_id: string; p_limit?: number; p_offset?: number };
        Returns: Array<{
          id: string;
          user_id: string;
          post_id: string;
          parent_comment_id: string | null;
          content: string;
          likes_count: number;
          replies_count: number;
          is_edited: boolean;
          created_at: string;
          level: number;
        }>;
      };
      soft_delete_comment: {
        Args: { comment_id: string };
        Returns: boolean;
      };
    };
  };
}

// Utility types for common queries
export type UserWithProfile = User & {
  individual_profile: IndividualProfile | null;
};

export type OrganizationWithAdmins = OrganizationProfile & {
  org_admins?: (OrgAdmin & { users?: User })[];
};

export type AdminWithUser = OrgAdmin & {
  users?: User;
  organization_profiles?: OrganizationProfile;
};

// Content-related utility types
export type PostWithAuthor = Post & {
  users?: User;
  organization_profiles?: OrganizationProfile;
  is_liked?: boolean;
  is_following_author?: boolean;
};

export type PostWithEngagement = Post & {
  users?: User;
  organization_profiles?: OrganizationProfile;
  post_likes?: PostLike[];
  post_comments?: PostComment[];
  is_liked?: boolean;
  user_reaction?: ReactionType | null;
};

export type GigWithPoster = Gig & {
  posted_by_user?: User;
  posted_by_organization?: OrganizationProfile;
};

export type CommentWithAuthor = PostComment & {
  users?: User;
  replies?: CommentWithAuthor[];
  is_liked?: boolean;
};

export type CommentThread = CommentWithAuthor & {
  level: number;
  replies?: CommentThread[];
};

export type FollowWithProfiles = Follow & {
  follower_user?: User;
  followed_user?: User;
  followed_organization?: OrganizationProfile;
};

export type UserWithStats = User & {
  individual_profile?: IndividualProfile;
  follower_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  is_mutual?: boolean;
};

export type OrganizationWithStats = OrganizationProfile & {
  follower_count?: number;
  posts_count?: number;
  gigs_count?: number;
  is_following?: boolean;
};

// Feed and discovery types
export type FeedPost = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  content: string | null;
  title: string | null;
  post_type: string;
  visibility: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked: boolean;
  author?: User | OrganizationProfile;
  media_urls?: string[];
  tags?: string[];
};

export type GigSearchResult = Gig & {
  distance?: number; // For location-based searches
  relevance_score?: number; // For search ranking
  posted_by_user?: User;
  posted_by_organization?: OrganizationProfile;
};
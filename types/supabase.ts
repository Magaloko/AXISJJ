export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; full_name: string; email: string; phone: string | null
          date_of_birth: string | null; role: 'member' | 'coach' | 'owner'
          avatar_url: string | null; language: 'de' | 'en'; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      belt_ranks: {
        Row: {
          id: string; name: string; stripes: number; order: number
          min_time_months: number | null; min_sessions: number | null; color_hex: string | null
        }
        Insert: Omit<Database['public']['Tables']['belt_ranks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['belt_ranks']['Insert']>
      }
      class_types: {
        Row: { id: string; name: string; description: string | null; level: 'beginner' | 'all' | 'advanced' | 'kids'; gi: boolean }
        Insert: Omit<Database['public']['Tables']['class_types']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['class_types']['Insert']>
      }
      class_sessions: {
        Row: {
          id: string; class_type_id: string; coach_id: string | null
          starts_at: string; ends_at: string; capacity: number
          location: string; recurring_group_id: string | null; cancelled: boolean
        }
        Insert: Omit<Database['public']['Tables']['class_sessions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['class_sessions']['Insert']>
      }
      bookings: {
        Row: {
          id: string; session_id: string; profile_id: string
          status: 'confirmed' | 'waitlisted' | 'cancelled'
          booked_at: string; waitlist_position: number | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booked_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      attendances: {
        Row: { id: string; session_id: string; profile_id: string; checked_in_at: string; checked_in_by: string | null }
        Insert: Omit<Database['public']['Tables']['attendances']['Row'], 'id' | 'checked_in_at'>
        Update: Partial<Database['public']['Tables']['attendances']['Insert']>
      }
      skill_categories: {
        Row: { id: string; name: string; order: number }
        Insert: Omit<Database['public']['Tables']['skill_categories']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['skill_categories']['Insert']>
      }
      skills: {
        Row: { id: string; category_id: string; name: string; description: string | null; video_url: string | null; belt_rank_id: string | null; order: number }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
      }
      skill_progress: {
        Row: { id: string; profile_id: string; skill_id: string; status: 'not_started' | 'in_progress' | 'mastered'; updated_at: string }
        Insert: Omit<Database['public']['Tables']['skill_progress']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['skill_progress']['Insert']>
      }
      leads: {
        Row: { id: string; full_name: string; email: string; phone: string | null; message: string | null; source: 'website' | 'instagram'; status: 'new' | 'contacted' | 'converted' | 'lost'; created_at: string }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      documents: {
        Row: { id: string; profile_id: string; type: 'waiver' | 'contract'; signed_at: string | null; content_url: string | null }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      profile_ranks: {
        Row: { id: string; profile_id: string; belt_rank_id: string; promoted_at: string; promoted_by: string | null; notes: string | null }
        Insert: Omit<Database['public']['Tables']['profile_ranks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['profile_ranks']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: { get_my_role: { Args: Record<string, never>; Returns: string } }
    Enums: Record<string, never>
  }
}

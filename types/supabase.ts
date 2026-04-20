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
        Relationships: []
      }
      belt_ranks: {
        Row: {
          id: string; name: string; stripes: number; order: number
          min_time_months: number | null; min_sessions: number | null; color_hex: string | null
        }
        Insert: Omit<Database['public']['Tables']['belt_ranks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['belt_ranks']['Insert']>
        Relationships: []
      }
      class_types: {
        Row: { id: string; name: string; description: string | null; level: 'beginner' | 'all' | 'advanced' | 'kids'; gi: boolean; image_url: string | null }
        Insert: { id?: string; name: string; description?: string | null; level?: 'beginner' | 'all' | 'advanced' | 'kids'; gi?: boolean; image_url?: string | null }
        Update: Partial<Database['public']['Tables']['class_types']['Insert']>
        Relationships: []
      }
      class_sessions: {
        Row: {
          id: string; class_type_id: string; coach_id: string | null
          starts_at: string; ends_at: string; capacity: number
          location: string; recurring_group_id: string | null; cancelled: boolean
        }
        Insert: { id?: string; class_type_id: string; coach_id?: string | null; starts_at: string; ends_at: string; capacity?: number; location?: string; recurring_group_id?: string | null; cancelled?: boolean }
        Update: Partial<Database['public']['Tables']['class_sessions']['Insert']>
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string; session_id: string; profile_id: string
          status: 'confirmed' | 'waitlisted' | 'cancelled'
          booked_at: string; waitlist_position: number | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booked_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
        Relationships: [
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      attendances: {
        Row: { id: string; session_id: string; profile_id: string; checked_in_at: string; checked_in_by: string | null }
        Insert: { session_id: string; profile_id: string; checked_in_at?: string; checked_in_by?: string | null }
        Update: Partial<Database['public']['Tables']['attendances']['Insert']>
        Relationships: [
          {
            foreignKeyName: "attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_categories: {
        Row: { id: string; name: string; order: number }
        Insert: Omit<Database['public']['Tables']['skill_categories']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['skill_categories']['Insert']>
        Relationships: []
      }
      skills: {
        Row: { id: string; category_id: string; name: string; description: string | null; video_url: string | null; belt_rank_id: string | null; order: number }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_belt_rank_id_fkey"
            columns: ["belt_rank_id"]
            isOneToOne: false
            referencedRelation: "belt_ranks"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_progress: {
        Row: { id: string; profile_id: string; skill_id: string; status: 'not_started' | 'in_progress' | 'mastered'; updated_at: string }
        Insert: Omit<Database['public']['Tables']['skill_progress']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['skill_progress']['Insert']>
        Relationships: [
          {
            foreignKeyName: "skill_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: { id: string; full_name: string; email: string; phone: string | null; message: string | null; source: 'website' | 'instagram'; status: 'new' | 'contacted' | 'converted' | 'lost'; created_at: string }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
        Relationships: []
      }
      coach_profiles: {
        Row: {
          id: string
          profile_id: string
          specialization: string | null
          bio: string | null
          achievements: string | null
          show_on_website: boolean
          display_order: number
          is_pinned: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          specialization?: string | null
          bio?: string | null
          achievements?: string | null
          show_on_website?: boolean
          display_order?: number
          is_pinned?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['coach_profiles']['Insert']>
        Relationships: [
          {
            foreignKeyName: "coach_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: { id: string; profile_id: string; type: 'waiver' | 'contract'; signed_at: string | null; content_url: string | null }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
        Relationships: [
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profile_ranks: {
        Row: { id: string; profile_id: string; belt_rank_id: string; promoted_at: string; promoted_by: string | null; notes: string | null }
        Insert: { id?: string; profile_id: string; belt_rank_id: string; promoted_at?: string; promoted_by?: string | null; notes?: string | null }
        Update: Partial<Database['public']['Tables']['profile_ranks']['Insert']>
        Relationships: [
          {
            foreignKeyName: "profile_ranks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_ranks_belt_rank_id_fkey"
            columns: ["belt_rank_id"]
            isOneToOne: false
            referencedRelation: "belt_ranks"
            referencedColumns: ["id"]
          }
        ]
      }
      gym_settings: {
        Row: {
          id: number
          name: string
          address_line1: string | null
          address_line2: string | null
          postal_code: string | null
          city: string | null
          country: string | null
          phone: string | null
          email: string | null
          website: string | null
          opening_hours: Json
          house_rules: string | null
          cancellation_policy: string | null
          pricing_info: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['gym_settings']['Row']>
        Update: Partial<Database['public']['Tables']['gym_settings']['Row']>
        Relationships: []
      }
      training_logs: {
        Row: {
          id: string
          profile_id: string
          session_id: string | null
          mood_before: number
          mood_after: number | null
          energy: number | null
          technique: number | null
          conditioning: number | null
          mental: number | null
          focus_areas: string[]
          notes: string | null
          next_goal: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          session_id?: string | null
          mood_before: number
          mood_after?: number | null
          energy?: number | null
          technique?: number | null
          conditioning?: number | null
          mental?: number | null
          focus_areas?: string[]
          notes?: string | null
          next_goal?: string | null
          logged_at?: string
        }
        Update: Partial<Database['public']['Tables']['training_logs']['Insert']>
        Relationships: []
      }
      bot_users: {
        Row: {
          chat_id: number
          profile_id: string
          bot_role: 'admin' | 'moderator' | 'coach' | 'member'
          telegram_username: string | null
          first_name: string | null
          linked_at: string
        }
        Insert: {
          chat_id: number
          profile_id: string
          bot_role?: 'admin' | 'moderator' | 'coach' | 'member'
          telegram_username?: string | null
          first_name?: string | null
          linked_at?: string
        }
        Update: Partial<Database['public']['Tables']['bot_users']['Insert']>
        Relationships: []
      }
      pricing_plans: {
        Row: {
          id: string
          category: 'students' | 'adults' | 'kids'
          duration_months: number
          price_per_month: number
          total_price: number | null
          highlighted: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          category: 'students' | 'adults' | 'kids'
          duration_months: number
          price_per_month: number
          total_price?: number | null
          highlighted?: boolean
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pricing_plans']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          profile_id: string
          category: 'students' | 'adults' | 'kids'
          duration_months: number
          price_per_month: number
          start_date: string
          end_date: string | null
          status: 'active' | 'paused' | 'cancelled' | 'expired'
          payment_method: 'sepa' | 'bar' | 'ueberweisung' | 'karte' | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category: 'students' | 'adults' | 'kids'
          duration_months: number
          price_per_month: number
          start_date?: string
          end_date?: string | null
          status?: 'active' | 'paused' | 'cancelled' | 'expired'
          payment_method?: 'sepa' | 'bar' | 'ueberweisung' | 'karte' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }
      session_notes: {
        Row: {
          id: string
          session_id: string
          author_id: string | null
          plan: string | null
          reflection: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          author_id?: string | null
          plan?: string | null
          reflection?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['session_notes']['Insert']>
        Relationships: []
      }
      competitions: {
        Row: {
          id: string
          profile_id: string
          name: string
          date: string
          location: string | null
          category: string | null
          placement: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          date: string
          location?: string | null
          category?: string | null
          placement?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['competitions']['Insert']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          actor_name: string | null
          action: string
          target_type: string | null
          target_id: string | null
          target_name: string | null
          meta: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_name?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          target_name?: string | null
          meta?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
        Relationships: []
      }
      coach_notes: {
        Row: {
          id: string
          profile_id: string
          author_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          author_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['coach_notes']['Insert']>
        Relationships: []
      }
      bot_link_codes: {
        Row: {
          code: string
          profile_id: string
          created_at: string
          expires_at: string
          used_at: string | null
          used_by_chat_id: number | null
        }
        Insert: {
          code: string
          profile_id: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          used_by_chat_id?: number | null
        }
        Update: Partial<Database['public']['Tables']['bot_link_codes']['Insert']>
        Relationships: []
      }
      curricula: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          duration_weeks: number
          age_group: 'adults' | 'kids'
          active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          duration_weeks?: number
          age_group?: 'adults' | 'kids'
          active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['curricula']['Insert']>
        Relationships: []
      }
      curriculum_tracks: {
        Row: {
          id: string
          curriculum_id: string
          class_type_id: string
          name: string
          sessions_per_week: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          curriculum_id: string
          class_type_id: string
          name: string
          sessions_per_week?: number
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['curriculum_tracks']['Insert']>
        Relationships: [
          {
            foreignKeyName: "curriculum_tracks_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_tracks_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          }
        ]
      }
      techniques: {
        Row: {
          id: string
          name: string
          slug: string
          category: 'position' | 'takedown' | 'submission' | 'sweep' | 'guard-pass' | 'escape' | 'transition' | 'drill'
          position: string | null
          belt_level: 'white' | 'blue' | 'purple' | 'brown' | 'black'
          gi: boolean
          description: string | null
          key_details: string[]
          common_mistakes: string[]
          video_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category: 'position' | 'takedown' | 'submission' | 'sweep' | 'guard-pass' | 'escape' | 'transition' | 'drill'
          position?: string | null
          belt_level?: 'white' | 'blue' | 'purple' | 'brown' | 'black'
          gi?: boolean
          description?: string | null
          key_details?: string[]
          common_mistakes?: string[]
          video_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['techniques']['Insert']>
        Relationships: []
      }
      curriculum_sessions: {
        Row: {
          id: string
          track_id: string
          week_number: number
          session_number: number
          title: string
          theme: string | null
          objectives: string[]
          warmup: string | null
          drilling: string | null
          sparring_focus: string | null
          homework: string | null
          duration_minutes: number
          prerequisite_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          track_id: string
          week_number: number
          session_number: number
          title: string
          theme?: string | null
          objectives?: string[]
          warmup?: string | null
          drilling?: string | null
          sparring_focus?: string | null
          homework?: string | null
          duration_minutes?: number
          prerequisite_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['curriculum_sessions']['Insert']>
        Relationships: [
          {
            foreignKeyName: "curriculum_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "curriculum_tracks"
            referencedColumns: ["id"]
          }
        ]
      }
      session_techniques: {
        Row: {
          session_id: string
          technique_id: string
          phase: 'warmup' | 'drilling' | 'main' | 'sparring' | 'review'
          sort_order: number
        }
        Insert: {
          session_id: string
          technique_id: string
          phase?: 'warmup' | 'drilling' | 'main' | 'sparring' | 'review'
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['session_techniques']['Insert']>
        Relationships: []
      }
      quizzes: {
        Row: {
          id: string
          session_id: string | null
          title: string
          description: string | null
          quiz_type: 'multiple_choice' | 'flashcard' | 'drag_match' | 'sequence'
          passing_score: number
          xp_reward: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          title: string
          description?: string | null
          quiz_type?: 'multiple_choice' | 'flashcard' | 'drag_match' | 'sequence'
          passing_score?: number
          xp_reward?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['quizzes']['Insert']>
        Relationships: [
          {
            foreignKeyName: "quizzes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "curriculum_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question: string
          question_type: 'multiple_choice' | 'true_false'
          explanation: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question: string
          question_type?: 'multiple_choice' | 'true_false'
          explanation?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_answers: {
        Row: {
          id: string
          question_id: string
          answer_text: string
          is_correct: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          question_id: string
          answer_text: string
          is_correct?: boolean
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['quiz_answers']['Insert']>
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          profile_id: string
          quiz_id: string
          score: number
          passed: boolean
          answers: Json
          completed_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          quiz_id: string
          score: number
          passed: boolean
          answers?: Json
          completed_at?: string
        }
        Update: Partial<Database['public']['Tables']['quiz_attempts']['Insert']>
        Relationships: []
      }
      learning_tasks: {
        Row: {
          id: string
          session_id: string | null
          title: string
          description: string | null
          task_type: 'reflection' | 'drill' | 'journal' | 'video' | 'reading'
          xp_reward: number
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          title: string
          description?: string | null
          task_type?: 'reflection' | 'drill' | 'journal' | 'video' | 'reading'
          xp_reward?: number
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['learning_tasks']['Insert']>
        Relationships: []
      }
      task_completions: {
        Row: {
          profile_id: string
          task_id: string
          notes: string | null
          completed_at: string
        }
        Insert: {
          profile_id: string
          task_id: string
          notes?: string | null
          completed_at?: string
        }
        Update: Partial<Database['public']['Tables']['task_completions']['Insert']>
        Relationships: []
      }
      rule_cards: {
        Row: {
          id: string
          category: 'scoring' | 'illegal' | 'time' | 'belt' | 'etiquette'
          question: string
          options: string[]
          correct_index: number
          explanation: string
          difficulty: 'white' | 'blue' | 'purple' | 'brown' | 'black'
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          category: 'scoring' | 'illegal' | 'time' | 'belt' | 'etiquette'
          question: string
          options: string[]
          correct_index: number
          explanation: string
          difficulty?: 'white' | 'blue' | 'purple' | 'brown' | 'black'
          xp_reward?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['rule_cards']['Insert']>
        Relationships: []
      }
      xp_events: {
        Row: {
          id: string
          profile_id: string
          source: 'quiz_pass' | 'quiz_attempt' | 'task_complete' | 'rule_correct' | 'attendance' | 'streak_bonus' | 'badge_earned' | 'manual'
          source_id: string | null
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          source: 'quiz_pass' | 'quiz_attempt' | 'task_complete' | 'rule_correct' | 'attendance' | 'streak_bonus' | 'badge_earned' | 'manual'
          source_id?: string | null
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['xp_events']['Insert']>
        Relationships: []
      }
      badges: {
        Row: {
          id: string
          code: string
          name: string
          description: string
          icon: string
          rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
          xp_reward: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description: string
          icon?: string
          rarity?: 'common' | 'uncommon' | 'rare' | 'legendary'
          xp_reward?: number
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['badges']['Insert']>
        Relationships: []
      }
      member_badges: {
        Row: {
          profile_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          profile_id: string
          badge_id: string
          earned_at?: string
        }
        Update: Partial<Database['public']['Tables']['member_badges']['Insert']>
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      }
      rule_card_attempts: {
        Row: {
          id: string
          profile_id: string
          rule_card_id: string
          selected_index: number
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          rule_card_id: string
          selected_index: number
          is_correct: boolean
          answered_at?: string
        }
        Update: Partial<Database['public']['Tables']['rule_card_attempts']['Insert']>
        Relationships: []
      }
    }
    Views: {
      public_coaches: {
        Row: {
          id: string
          full_name: string
          role: 'coach' | 'owner'
          avatar_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: { Args: Record<PropertyKey, never>; Returns: string }
      book_class: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: { status?: 'confirmed' | 'waitlisted'; error?: string }
      }
      promote_waitlist: {
        Args: { p_session_id: string }
        Returns: string | null
      }
      leaderboard_top: {
        Args: { n?: number }
        Returns: { profile_id: string; full_name: string; total_xp: number; badge_count: number }[]
      }
    }
    Enums: { [_ in never]: never }
  }
}

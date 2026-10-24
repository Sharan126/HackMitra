export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdministrativeDivision = "Belagavi" | "Kalaburagi" | "Mysuru" | "Bengaluru";

export type KDEMCluster =
  | "Bengaluru Urban"
  | "Hubballi-Dharwad-Belagavi"
  | "Mysuru Cluster"
  | "Mangaluru Coastal"
  | "Kalyana Karnataka"
  | "Central Karnataka";

export type CoverageStatus = "verified_active" | "verified_zero" | "seeking_leads";

export type OrganizerType =
  | "College"
  | "University"
  | "KDEM / K-Tech"
  | "Incubator"
  | "Student Club"
  | "Corporate";

export type ParticipationFormat = "in_person" | "hybrid" | "online";

export type CurrentStatus =
  | "open"
  | "deadline_today"
  | "closing_soon"
  | "upcoming"
  | "ongoing"
  | "closed"
  | "completed"
  | "cancelled"
  | "unverified"
  | "stale";

export type VerificationStatus = "verified" | "pending_verification" | "rejected";

export type SourceType =
  | "aggregator"
  | "university_portal"
  | "college_circular"
  | "manual_submission"
  | "rss_feed";

export type DiscoveryRunStatus = "running" | "completed" | "failed" | "partial";

export type IngestionStatus = "mapped" | "unmapped" | "duplicate" | "flagged";

export type VerifierType = "automated_bot" | "moderator" | "campus_scout";

export type VerificationCheckType =
  | "link_liveness"
  | "dates_consistency"
  | "circular_proof_check"
  | "organizer_verification"
  | "manual_audit"
  | "deadline_recheck"
  | "cancellation_check"
  | "postponement_check"
  | "extension_detected"
  | "stale_detection";

export interface Database {
  public: {
    Tables: {
      districts: {
        Row: {
          id: string;
          name: string;
          kannada_name: string;
          slug: string;
          headquarters: string;
          division: AdministrativeDivision;
          kdem_cluster: KDEMCluster;
          monitored_colleges_count: number;
          nain_centers_count: number;
          coverage_status: CoverageStatus;
          last_audited_at: string | null;
          audit_frequency_hours: number;
          key_institutions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          kannada_name: string;
          slug: string;
          headquarters: string;
          division: AdministrativeDivision;
          kdem_cluster: KDEMCluster;
          monitored_colleges_count?: number;
          nain_centers_count?: number;
          coverage_status?: CoverageStatus;
          last_audited_at?: string | null;
          audit_frequency_hours?: number;
          key_institutions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          kannada_name?: string;
          slug?: string;
          headquarters?: string;
          division?: AdministrativeDivision;
          kdem_cluster?: KDEMCluster;
          monitored_colleges_count?: number;
          nain_centers_count?: number;
          coverage_status?: CoverageStatus;
          last_audited_at?: string | null;
          audit_frequency_hours?: number;
          key_institutions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_sources: {
        Row: {
          id: string;
          name: string;
          source_type: SourceType;
          base_url: string | null;
          is_active: boolean;
          reliability_score: number;
          last_scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          source_type: SourceType;
          base_url?: string | null;
          is_active?: boolean;
          reliability_score?: number;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          source_type?: SourceType;
          base_url?: string | null;
          is_active?: boolean;
          reliability_score?: number;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discovery_runs: {
        Row: {
          id: string;
          source_id: string | null;
          status: DiscoveryRunStatus;
          started_at: string;
          completed_at: string | null;
          records_ingested: number;
          events_discovered: number;
          events_updated: number;
          error_message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          status: DiscoveryRunStatus;
          started_at?: string;
          completed_at?: string | null;
          records_ingested?: number;
          events_discovered?: number;
          events_updated?: number;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string | null;
          status?: DiscoveryRunStatus;
          started_at?: string;
          completed_at?: string | null;
          records_ingested?: number;
          events_discovered?: number;
          events_updated?: number;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      hackathons: {
        Row: {
          id: string;
          slug: string;
          title: string;
          tagline: string | null;
          description: string;
          organizer: string;
          organizer_type: OrganizerType;
          city: string;
          district_id: string;
          district_name: string;
          venue: string;
          format: ParticipationFormat;
          is_beyond_bengaluru: boolean;
          cluster: string;
          official_website_url: string;
          registration_url: string;
          registration_deadline: string;
          start_date: string;
          end_date: string;
          eligibility: string;
          team_size_min: number;
          team_size_max: number;
          prize_pool_text: string;
          prize_pool_inr: number;
          is_free: boolean;
          registration_fee_inr: number;
          fee_amount_text: string | null;
          technology_domains: string[];
          theme_tags: string[];
          current_status: CurrentStatus;
          verification_status: VerificationStatus;
          is_date_only_deadline: boolean;
          registration_deadline_raw: string | null;
          next_verification_due_at: string | null;
          verification_notes: string | null;
          last_verified_at: string;
          source_proof_url: string | null;
          rounds: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          tagline?: string | null;
          description: string;
          organizer: string;
          organizer_type?: OrganizerType;
          city: string;
          district_id: string;
          district_name: string;
          venue: string;
          format: ParticipationFormat;
          is_beyond_bengaluru?: boolean;
          cluster: string;
          official_website_url: string;
          registration_url: string;
          registration_deadline: string;
          is_date_only_deadline?: boolean;
          registration_deadline_raw?: string | null;
          next_verification_due_at?: string | null;
          verification_notes?: string | null;
          start_date: string;
          end_date: string;
          eligibility?: string;
          team_size_min?: number;
          team_size_max?: number;
          prize_pool_text?: string;
          prize_pool_inr?: number;
          is_free?: boolean;
          registration_fee_inr?: number;
          fee_amount_text?: string | null;
          technology_domains?: string[];
          theme_tags?: string[];
          current_status?: CurrentStatus;
          verification_status?: VerificationStatus;
          last_verified_at?: string;
          source_proof_url?: string | null;
          rounds?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          tagline?: string | null;
          description?: string;
          organizer?: string;
          organizer_type?: OrganizerType;
          city?: string;
          district_id?: string;
          district_name?: string;
          venue?: string;
          format?: ParticipationFormat;
          is_beyond_bengaluru?: boolean;
          cluster?: string;
          official_website_url?: string;
          registration_url?: string;
          registration_deadline?: string;
          is_date_only_deadline?: boolean;
          registration_deadline_raw?: string | null;
          next_verification_due_at?: string | null;
          verification_notes?: string | null;
          start_date?: string;
          end_date?: string;
          eligibility?: string;
          team_size_min?: number;
          team_size_max?: number;
          prize_pool_text?: string;
          prize_pool_inr?: number;
          is_free?: boolean;
          registration_fee_inr?: number;
          fee_amount_text?: string | null;
          technology_domains?: string[];
          theme_tags?: string[];
          current_status?: CurrentStatus;
          verification_status?: VerificationStatus;
          last_verified_at?: string;
          source_proof_url?: string | null;
          rounds?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hackathon_source_records: {
        Row: {
          id: string;
          hackathon_id: string | null;
          source_id: string;
          discovery_run_id: string | null;
          external_event_id: string | null;
          external_url: string;
          raw_payload: Json;
          extracted_title: string | null;
          extracted_deadline: string | null;
          extracted_venue: string | null;
          ingestion_status: IngestionStatus;
          confidence_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hackathon_id?: string | null;
          source_id: string;
          discovery_run_id?: string | null;
          external_event_id?: string | null;
          external_url: string;
          raw_payload?: Json;
          extracted_title?: string | null;
          extracted_deadline?: string | null;
          extracted_venue?: string | null;
          ingestion_status?: IngestionStatus;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hackathon_id?: string | null;
          source_id?: string;
          discovery_run_id?: string | null;
          external_event_id?: string | null;
          external_url?: string;
          raw_payload?: Json;
          extracted_title?: string | null;
          extracted_deadline?: string | null;
          extracted_venue?: string | null;
          ingestion_status?: IngestionStatus;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      verification_logs: {
        Row: {
          id: string;
          hackathon_id: string;
          verifier_type: VerifierType;
          verifier_identity: string;
          previous_status: string | null;
          new_status: string;
          verification_check_type: VerificationCheckType;
          is_verified: boolean;
          notes: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          hackathon_id: string;
          verifier_type: VerifierType;
          verifier_identity: string;
          previous_status?: string | null;
          new_status: string;
          verification_check_type: VerificationCheckType;
          is_verified: boolean;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          hackathon_id?: string;
          verifier_type?: VerifierType;
          verifier_identity?: string;
          previous_status?: string | null;
          new_status?: string;
          verification_check_type?: VerificationCheckType;
          is_verified?: boolean;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_events: {
        Row: {
          id: string;
          user_id: string;
          hackathon_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hackathon_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hackathon_id?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          email: string | null;
          home_district_id: string | null;
          preferred_districts: string[];
          preferred_themes: string[];
          notify_email: boolean;
          notify_deadline_reminders: boolean;
          notify_new_in_district: boolean;
          notify_status_changes: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          home_district_id?: string | null;
          preferred_districts?: string[];
          preferred_themes?: string[];
          notify_email?: boolean;
          notify_deadline_reminders?: boolean;
          notify_new_in_district?: boolean;
          notify_status_changes?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          home_district_id?: string | null;
          preferred_districts?: string[];
          preferred_themes?: string[];
          notify_email?: boolean;
          notify_deadline_reminders?: boolean;
          notify_new_in_district?: boolean;
          notify_status_changes?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_subscriptions: {
        Row: {
          id: string;
          email: string;
          district_id: string | null;
          is_active: boolean;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          district_id?: string | null;
          is_active?: boolean;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          district_id?: string | null;
          is_active?: boolean;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_delivery_logs: {
        Row: {
          id: string;
          user_id: string | null;
          recipient_email: string;
          notification_type: NotificationType;
          hackathon_id: string | null;
          dedup_key: string;
          subject: string;
          body_preview: string | null;
          provider: string;
          status: DeliveryStatus;
          error_message: string | null;
          metadata: Json;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          recipient_email: string;
          notification_type: NotificationType;
          hackathon_id?: string | null;
          dedup_key: string;
          subject: string;
          body_preview?: string | null;
          provider?: string;
          status: DeliveryStatus;
          error_message?: string | null;
          metadata?: Json;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          recipient_email?: string;
          notification_type?: NotificationType;
          hackathon_id?: string | null;
          dedup_key?: string;
          subject?: string;
          body_preview?: string | null;
          provider?: string;
          status?: DeliveryStatus;
          error_message?: string | null;
          metadata?: Json;
          sent_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      scheduled_reminders: {
        Row: {
          id: string;
          user_id: string;
          hackathon_id: string;
          reminder_type: ReminderType;
          target_deadline: string;
          scheduled_for: string;
          status: ReminderStatus;
          last_processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hackathon_id: string;
          reminder_type: ReminderType;
          target_deadline: string;
          scheduled_for: string;
          status?: ReminderStatus;
          last_processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hackathon_id?: string;
          reminder_type?: ReminderType;
          target_deadline?: string;
          scheduled_for?: string;
          status?: ReminderStatus;
          last_processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      administrative_division: AdministrativeDivision;
      kdem_cluster: KDEMCluster;
      coverage_status: CoverageStatus;
      organizer_type: OrganizerType;
      participation_format: ParticipationFormat;
      current_status: CurrentStatus;
      verification_status: VerificationStatus;
      source_type: SourceType;
    };
  };
}

export type NotificationType =
  | "new_matching_event"
  | "deadline_reminder"
  | "status_or_deadline_change"
  | "test_notification";

export type DeliveryStatus = "delivered" | "failed" | "cancelled" | "skipped_opt_out";
export type ReminderType = "24h_before_deadline" | "48h_before_deadline" | "deadline_today";
export type ReminderStatus = "pending" | "sent" | "cancelled" | "stale";

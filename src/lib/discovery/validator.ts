import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";
import { Database } from "@/types/database.types";

export type HackathonDraft = Omit<
  Database["public"]["Tables"]["hackathons"]["Insert"],
  "id" | "created_at" | "updated_at"
>;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates extracted event drafts for database schema integrity
 */
export function validateExtractedDraft(draft: Partial<HackathonDraft>): ValidationResult {
  const errors: string[] = [];

  // Title validation
  if (!draft.title || draft.title.trim().length < 3) {
    errors.push("Event title must be at least 3 characters long");
  }

  // Description validation
  if (!draft.description || draft.description.trim().length < 10) {
    errors.push("Event description must be at least 10 characters long");
  }

  // Organizer validation
  if (!draft.organizer || draft.organizer.trim().length === 0) {
    errors.push("Organizer name is required");
  }

  // District validation (must match one of 31 Karnataka districts)
  if (!draft.district_id) {
    errors.push("District ID is required");
  } else {
    const validDistrict = KARNATAKA_DISTRICTS.some((d) => d.id === draft.district_id);
    if (!validDistrict) {
      errors.push(`Invalid district ID '${draft.district_id}' - not one of 31 Karnataka districts`);
    }
  }

  // Format validation
  const validFormats = ["in_person", "hybrid", "online"];
  if (!draft.format || !validFormats.includes(draft.format)) {
    errors.push(`Format must be one of: ${validFormats.join(", ")}`);
  }

  // URL validations
  if (!draft.registration_url) {
    errors.push("Registration URL is required");
  } else {
    try {
      const parsed = new URL(draft.registration_url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.push("Registration URL must use HTTP or HTTPS protocol");
      }
    } catch {
      errors.push(`Invalid registration URL: '${draft.registration_url}'`);
    }
  }

  if (draft.official_website_url) {
    try {
      const parsed = new URL(draft.official_website_url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.push("Official website URL must use HTTP or HTTPS protocol");
      }
    } catch {
      errors.push(`Invalid official website URL: '${draft.official_website_url}'`);
    }
  }

  // Temporal Validations
  if (!draft.start_date || isNaN(Date.parse(draft.start_date))) {
    errors.push("Valid start_date timestamp is required");
  }

  if (!draft.end_date || isNaN(Date.parse(draft.end_date))) {
    errors.push("Valid end_date timestamp is required");
  }

  if (!draft.registration_deadline || isNaN(Date.parse(draft.registration_deadline))) {
    errors.push("Valid registration_deadline timestamp is required");
  }

  if (draft.start_date && draft.end_date) {
    const start = new Date(draft.start_date).getTime();
    const end = new Date(draft.end_date).getTime();
    if (end < start) {
      errors.push("Event end_date must be on or after start_date");
    }

    if (draft.registration_deadline) {
      const deadline = new Date(draft.registration_deadline).getTime();
      if (deadline > end) {
        errors.push("Registration deadline cannot be after event end_date");
      }
    }
  }

  // Economic & Team constraints
  if (draft.team_size_min && draft.team_size_max && draft.team_size_max < draft.team_size_min) {
    errors.push("Maximum team size must be greater than or equal to minimum team size");
  }

  if (draft.prize_pool_inr !== undefined && draft.prize_pool_inr < 0) {
    errors.push("Prize pool INR cannot be negative");
  }

  if (draft.registration_fee_inr !== undefined && draft.registration_fee_inr < 0) {
    errors.push("Registration fee INR cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

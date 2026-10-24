export type ParticipationFormat = "in_person" | "hybrid" | "online";

export type RegistrationStatus =
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

export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description: string;
  organizer: string;
  organizerType: "College" | "University" | "KDEM / K-Tech" | "Incubator" | "Student Club" | "Corporate";
  city: string;
  districtId: string;
  districtName: string;
  kannadaDistrict?: string;
  cluster: string;
  isBeyondBengaluru: boolean;
  venue: string;
  format: ParticipationFormat;
  startDate: string; // ISO date or formatted
  endDate: string;
  registrationDeadline: string; // ISO date or formatted
  isDateOnlyDeadline?: boolean;
  registrationDeadlineRaw?: string;
  daysRemaining?: number;
  prizePool: string;
  prizePoolInr?: number;
  isFree: boolean;
  feeAmount?: string;
  registrationFeeInr?: number;
  teamSize: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  eligibility?: string;
  technologyDomains?: string[];
  themeTags: string[];
  officialWebsiteUrl: string;
  registrationUrl: string;
  sourcePlatform: string;
  sourceProofUrl: string;
  registrationStatus: RegistrationStatus;
  verificationStatus?: "verified" | "pending_verification" | "rejected";
  verifiedAt: string;
  nextVerificationDueAt?: string;
  verificationNotes?: string;
  discoveredAt: string;
  rounds?: { title: string; date: string; description: string }[];
}

export interface HomepageStats {
  openRegistrations: number;
  upcomingEvents: number;
  ongoingOrThisMonth: number;
  districtsRepresented: number;
  totalDistrictsCount: number;
  lastUpdatedTimestamp: string;
}

export interface DistrictSummary {
  id: string;
  slug: string;
  name: string;
  kannadaName: string;
  headquarters: string;
  division: "Bengaluru" | "Belagavi" | "Kalaburagi" | "Mysuru";
  cluster: string;
  hackathonCount: number;
  openCount: number;
  upcomingCount: number;
  monitoredCollegesCount: number;
  nainCentersCount: number;
  coverageStatus: "verified_active" | "verified_zero" | "seeking_leads";
  lastAudited: string;
  auditFrequencyHours: number;
  keyColleges: string[];
}

export type SortOption =
  | "relevance"
  | "deadline_asc"
  | "deadline_desc"
  | "date_asc"
  | "date_desc"
  | "recent_discovery"
  | "prize_desc";

export interface SearchAndFilterParams {
  search?: string;
  districtId?: string;
  city?: string;
  registrationStatus?: RegistrationStatus | "all" | "open_only";
  deadlineRange?: "7_days" | "14_days" | "30_days" | "all";
  deadlineBefore?: string; // YYYY-MM-DD
  deadlineAfter?: string;  // YYYY-MM-DD
  eventDateRange?: "this_month" | "next_month" | "upcoming" | "all";
  startDateAfter?: string; // YYYY-MM-DD
  endDateBefore?: string;  // YYYY-MM-DD
  format?: ParticipationFormat | "all";
  feeType?: "all" | "free" | "paid";
  eligibility?: "all" | "students_only" | "open_to_all";
  participationType?: "all" | "individual" | "team_only";
  teamSize?: number; // specific team size, e.g. 1, 2, 3, 4
  technologyDomain?: string; // e.g. 'AI', 'Blockchain', 'IoT', 'Web3'
  organizerType?: "College" | "University" | "KDEM / K-Tech" | "Incubator" | "Student Club" | "Corporate" | "all";
  prizePoolVerified?: boolean; // verified prize pool > 0
  minPrizeInr?: number; // minimum prize pool INR
  cluster?: string;
  sortBy?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedHackathonsResult {
  hackathons: Hackathon[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  appliedFilters: SearchAndFilterParams;
}

export interface HackathonFilters {
  search?: string;
  districtId?: string;
  city?: string;
  registrationStatus?: string;
  deadlineRange?: string; // '7_days' | '14_days' | '30_days' | 'all'
  format?: string; // 'in_person' | 'hybrid' | 'online' | 'all'
  cluster?: string;
  onlyFree?: boolean;
  eligibility?: string;
  participationType?: string;
  teamSize?: number;
  technologyDomain?: string;
  organizerType?: string;
  prizePoolVerified?: boolean;
  minPrizeInr?: number;
  sortBy?: SortOption;
}

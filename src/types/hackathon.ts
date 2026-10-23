export type ParticipationFormat = "in_person" | "hybrid" | "online";

export type RegistrationStatus = "open" | "closing_soon" | "closed" | "upcoming";

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
  daysRemaining?: number;
  prizePool: string;
  prizePoolInr?: number;
  isFree: boolean;
  feeAmount?: string;
  teamSize: string;
  themeTags: string[];
  officialWebsiteUrl: string;
  registrationUrl: string;
  sourcePlatform: string;
  sourceProofUrl: string;
  registrationStatus: RegistrationStatus;
  verifiedAt: string;
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

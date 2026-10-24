/**
 * Asia/Kolkata (IST) Timezone and Deadline Calculation Utilities
 * 
 * HackMitra strictly operates on the Asia/Kolkata timezone (+05:30).
 * Handles date-only deadlines without fabricating arbitrary cutoff times.
 */

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Returns formatted calendar date in Asia/Kolkata (YYYY-MM-DD)
 */
export function getIstCalendarDate(input: Date | string | number): string {
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  // en-CA produces YYYY-MM-DD format
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Checks if two dates fall on the exact same calendar day in Asia/Kolkata
 */
export function isSameIstDay(d1: Date | string | number, d2: Date | string | number): boolean {
  return getIstCalendarDate(d1) === getIstCalendarDate(d2);
}

/**
 * Formats date into readable IST string (e.g., "10 Nov 2026")
 */
export function formatIstDate(input: Date | string | number): string {
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formats date and time into readable IST string (e.g., "10 Nov 2026, 06:00 PM IST")
 */
export function formatIstDateTime(input: Date | string | number): string {
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${formatted} IST`;
}

/**
 * Detects whether a deadline string specifies a date-only value (without time of day)
 */
export function isDateOnlyDeadlineString(raw: string): boolean {
  if (!raw) return true;
  const trimmed = raw.trim();

  // Pattern matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;

  // Pattern matches "10 Nov 2026" or "Nov 10, 2026" without colon ":" (which indicates time)
  if (!trimmed.includes(":") && !trimmed.includes("T") && !trimmed.toLowerCase().includes("am") && !trimmed.toLowerCase().includes("pm")) {
    return true;
  }

  // ISO timestamp with midnight UTC exactly (often default for date-only DB stores)
  if (/T00:00:00(\.000)?Z?$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Calculates end of day in Asia/Kolkata for a date-only deadline
 * When an organizer specifies a date-only deadline, the student has until
 * the end of that calendar day in Karnataka (23:59:59.999 IST = 18:29:59.999 UTC).
 */
export function getEndOfIstDayUtc(dateInput: Date | string): Date {
  const istDateStr = getIstCalendarDate(dateInput); // YYYY-MM-DD
  // In IST (+05:30), 23:59:59.999 corresponds to YYYY-MM-DD 18:29:59.999Z UTC
  const [year, month, day] = istDateStr.split("-").map(Number);
  
  // Construct date at 23:59:59.999 in IST
  // ISO with +05:30 offset
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoWithOffset = `${year}-${pad(month)}-${pad(day)}T23:59:59.999+05:30`;
  return new Date(isoWithOffset);
}

/**
 * Difference in full calendar days between reference time and target in Asia/Kolkata
 */
export function getIstDaysDifference(
  targetDate: Date | string,
  referenceDate: Date | string = new Date()
): number {
  const targetCal = getIstCalendarDate(targetDate);
  const refCal = getIstCalendarDate(referenceDate);

  const tMs = new Date(`${targetCal}T00:00:00Z`).getTime();
  const rMs = new Date(`${refCal}T00:00:00Z`).getTime();

  return Math.round((tMs - rMs) / (1000 * 60 * 60 * 24));
}

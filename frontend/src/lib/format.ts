// Pure, dependency-free formatting and display helpers shared across the UI.
// Kept side-effect free so they are trivially unit-testable.

/** Join truthy class name fragments into a single className string. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Up-to-two uppercase initials from a name ("Ada Lovelace" → "AL"). */
export function getInitials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_HUES = [185, 150, 45, 265, 320, 210];

/** Deterministic avatar hue derived from a name's length. */
export function avatarHue(name: string | null | undefined): number {
  return AVATAR_HUES[(name ?? "").length % AVATAR_HUES.length];
}

/**
 * A streak is "active" when the last submission date (YYYY-MM-DD) matches
 * today's date in East Africa Time (UTC+3).
 */
export function isStreakActive(lastSubmissionDate: string | null | undefined): boolean {
  if (!lastSubmissionDate) return false;
  const nowEAT = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return nowEAT.toISOString().slice(0, 10) === lastSubmissionDate;
}

/** Clamp a number to the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Pluralize a noun based on count: pluralize(1,"day") → "1 day". */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count} ${word}`;
}

/** Truncate a string to `max` chars, appending an ellipsis when cut. */
export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

/** Compact number formatting: 1500 → "1.5k", 2_000_000 → "2M". */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 1000) return String(n);
  if (abs < 1_000_000) return trimZero(n / 1000) + "k";
  return trimZero(n / 1_000_000) + "M";
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Jun 2026" — locale-independent short date. */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Relative time: "just now", "5m ago", "3h ago", "2d ago", else short date. */
export function timeAgo(date: string | number | Date | null | undefined, now: Date = new Date()): string {
  if (!date) return "";
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "";
  const diff = now.getTime() - then;
  if (diff < MIN) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(date);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Short relative time: "now", "2m", "3h", "2d". */
export function relativeTime(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  // Under a minute, or slightly in the future because of clock skew.
  if (!Number.isFinite(diff) || diff < MINUTE) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  return `${Math.floor(diff / DAY)}d`;
}

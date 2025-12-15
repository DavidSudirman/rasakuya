// src/lib/dates.ts
// Format a Date to local YYYY-MM-DD (no timezone surprises)
export function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Build an ISO string at 12:00 UTC for a given local YYYY-MM-DD
// (consistent "same day" regardless of user timezone)
export function utcNoonIsoFromYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();
}

// Add N days to a YYYY-MM-DD in *local* time and return YYYY-MM-DD
export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return ymdLocal(dt);
}
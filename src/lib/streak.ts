// src/lib/streak.ts
import { addDaysYmd } from './dates';

// entriesYmd: list of YYYY-MM-DD that have at least one mood log
export function computeDailyStreak(
  entriesYmd: string[],
  todayYmd: string
): { streak: number; hasToday: boolean; streakDays: Set<string> } {
  const set = new Set(entriesYmd);
  const hasToday = set.has(todayYmd);

  let cursor = hasToday ? todayYmd : addDaysYmd(todayYmd, -1);
  let streak = 0;
  const days = new Set<string>();

  while (set.has(cursor)) {
    days.add(cursor);
    streak++;
    cursor = addDaysYmd(cursor, -1);
  }
  return { streak, hasToday, streakDays: days };
}

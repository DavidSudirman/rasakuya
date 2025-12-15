// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse ARUNA's compact memory block from a reply.
 * Looks for:
 * <memory>
 * {"items":["...", "..."]}
 * </memory>
 *
 * Returns a string[] of items (dedup/trim in DB layer).
 */
export function extractMemoryItems(reply: string): string[] {
  if (!reply) return [];
  const m = reply.match(/<memory>\s*([\s\S]*?)\s*<\/memory>/i);
  if (!m) return [];
  try {
    const obj = JSON.parse(m[1]);
    const arr = Array.isArray(obj?.items) ? obj.items : [];
    return arr
      .filter((x) => typeof x === "string")
      .map((s: string) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

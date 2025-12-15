// src/lib/voiceRules.ts
import type { FeatureSummary } from "@/hooks/useAudioFeatures";

export type VoiceLabels = {
  volumeLevel: "low"|"medium"|"high";
  toneVariation: "flat"|"natural"|"expressive";
  nervousness: "low"|"medium"|"high";
  paceHint?: "slow"|"neutral"|"fast"; // attach later if you compute WPM
  notes: string[];
};

export function labelFromSummary(s: FeatureSummary): VoiceLabels {
  const notes: string[] = [];
  const volumeLevel = s.volumeAvg < 0.015 ? "low" : s.volumeAvg < 0.05 ? "medium" : "high";
  const toneVariation = s.pitchStd < 8 ? "flat" : s.pitchStd < 30 ? "natural" : "expressive";
  const nScore = (s.jitter > 0.08 ? 1 : 0) + (s.shimmer > 0.12 ? 1 : 0) + (s.brightnessStd > 500 ? 1 : 0);
  const nervousness = nScore >= 2 ? "high" : nScore === 1 ? "medium" : "low";
  notes.push(`RMS ${s.volumeAvg.toFixed(3)} (${volumeLevel})`);
  if (s.pitchMean>0) notes.push(`f0 ${Math.round(s.pitchMean)} Hz (σ ${Math.round(s.pitchStd)})`);
  notes.push(`jitter ${(s.jitter*100).toFixed(1)}%`);
  notes.push(`shimmer ${(s.shimmer*100).toFixed(1)}%`);
  notes.push(`centroid σ ${Math.round(s.brightnessStd)}`);
  return { volumeLevel, toneVariation, nervousness, notes };
}

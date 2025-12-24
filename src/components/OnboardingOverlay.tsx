// src/components/OnboardingOverlay.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onDone: () => void;
};

type Prefs = {
  style?: string;
  voiceOn?: boolean;
  voiceGender?: "auto" | "male" | "female";
  voiceName?: string | null;
};

function parsePrefs(raw?: string | null): Prefs {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { style: raw || "" }; }
}

export default function OnboardingOverlay({ open, onDone }: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0..2 = lines, 3 = question
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const L = {
    en: {
      l1: "Everyone deserves to be heard",
      l2: "The right AI can change your life",
      l3: "Let’s imagine yours, together.",
      q: "What is your ideal AI companion (AI is not intended to diagnose, treat, cure, or prevent any medical or mental health condition)?",
      placeholder: "Write freely—tone, style, things you like/dislike…",
      saving: "Saving...",
      cta: "Continue",
      err: "Failed to save preferences.",
      ok: "ARUNA preferences saved.",
    },
    id: {
      l1: "Setiap orang berhak didengarkan",
      l2: "AI yang tepat dapat mengubah hidup Anda",
      l3: "Mari kita bayangkan hidup Anda bersama-sama.",
      q: "AI pendamping ideal kamu itu seperti apa (AI tidak dimaksudkan untuk mendiagnosis, mengobati, menyembuhkan, atau mencegah kondisi medis atau kesehatan mental apa pun)?",
      placeholder: "Tulis sebebasnya—gaya bicara, nada, hal yang kamu suka/tidak suka…",
      saving: "Menyimpan...",
      cta: "Lanjut",
      err: "Gagal menyimpan preferensi.",
      ok: "Preferensi ARUNA disimpan.",
    },
  }[language === "id" ? "id" : "en"];

  // simple stepped intro like your Auth screen
  useEffect(() => {
    if (!open) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStep(1), 1500));
    timers.push(window.setTimeout(() => setStep(2), 2000));
    timers.push(window.setTimeout(() => setStep(3), 2000));
    return () => timers.forEach(clearTimeout);
  }, [open]);

  async function save() {
    if (!user || !value.trim()) return;
    setSaving(true);
    try {
      // Load existing to merge (keeps voice settings if present)
      const { data, error } = await supabase
        .from("profiles")
        .select("aruna_preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      const prev = parsePrefs(data?.aruna_preferences);
      const merged: Prefs = { ...prev, style: value.trim() };

      const { error: upErr } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            aruna_preferences: JSON.stringify(merged),
            has_completed_onboarding: true,
          },
          { onConflict: "user_id" }
        );
      if (upErr) throw upErr;

      toast({ title: "OK", description: L.ok });
      onDone(); // hide overlay
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: L.err, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const FADE = 0.45;
  const lines = [L.l1, L.l2, L.l3];
  const idx = Math.min(step, 2);

  return (
    <div className="fixed inset-0 z-[70] bg-white/70 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto p-6">
        <div className="text-center space-y-4 min-h-[160px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step < 3 ? (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: FADE }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-semibold tracking-tight">{lines[idx]}</h1>
              </motion.div>
            ) : (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: FADE }}
                className="w-full"
              >
                <h2 className="text-2xl font-semibold mb-4">{L.q}</h2>
                <Textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={L.placeholder}
                  className="min-h-[140px]"
                  disabled={saving}
                />
                <div className="flex justify-end mt-4">
                  <Button onClick={save} disabled={!value.trim() || saving}>
                    {saving ? L.saving : L.cta}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

export default function OnboardingTherapist() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [questionVisible, setQuestionVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const txt = {
    ask: language === "id" ? "Terapi ideal kamu itu seperti apa?" : "What is your ideal therapist?",
    placeholder: language === "id"
      ? "Tulis sebebasnya—gaya bicara, nada, hal yang kamu suka/tidak suka…"
      : "Write freely—tone, style, things you like/dislike…",
    cta: language === "id" ? "Lanjut" : "Continue",
    confirm: language === "id" ? "Kami punya yang cocok untukmu. Kenalkan, ARUNA." : "We have a suitable match for you. Meet ARUNA.",
    error: language === "id" ? "Gagal menyimpan preferensi." : "Failed to save preferences.",
    needAuth: language === "id" ? "Silakan login dahulu." : "Please sign in first."
  };

  useEffect(() => {
    const t = setTimeout(() => setQuestionVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  async function saveAndContinue() {
    if (!user) {
      toast({ title: "Auth", description: txt.needAuth, variant: "destructive" });
      return;
    }
    if (!value.trim()) return;

    setSaving(true);
    try {
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

      setConfirmVisible(true);
      setTimeout(() => navigate("/ai-therapist"), 1500);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: txt.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl mx-auto p-6">
        <div className={`transition-opacity duration-700 ${questionVisible ? "opacity-100" : "opacity-0"}`}>
          <h1 className="text-2xl font-semibold text-center mb-6">{txt.ask}</h1>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={txt.placeholder}
            className="min-h-[160px] mb-4"
            disabled={saving}
          />
          <div className="flex justify-end">
            <Button onClick={saveAndContinue} disabled={!value.trim() || saving}>
              {saving ? (language === "id" ? "Menyimpan..." : "Saving...") : txt.cta}
            </Button>
          </div>
        </div>

        <div className={`mt-6 text-center text-lg transition-opacity duration-700 ${confirmVisible ? "opacity-100" : "opacity-0"}`}>
          {txt.confirm}
        </div>
      </Card>
    </div>
  );
}

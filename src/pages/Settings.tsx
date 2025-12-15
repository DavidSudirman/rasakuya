// src/pages/Settings.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AccountDropdown } from "@/components/AccountDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;
export default function Settings() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const email = user?.email || "";
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // load profile.name from DB
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        setName(
          data?.name ||
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            (email ? email.split("@")[0] : "")
        );
      } catch (err) {
        console.error("Error loading profile:", err);
        toast({
          title: "Gagal memuat profil",
          description: "Coba lagi beberapa saat lagi.",
          variant: "destructive",
        });
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [user, email, toast]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // check if profile row exists
      const { data: existing, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // update
        const { error } = await supabase
          .from("profiles")
          .update({
            name,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // insert new
        const { error } = await supabase.from("profiles").insert({
          user_id: user.id,
          name,
        });
        if (error) throw error;
      }

      toast({
        title: "Berhasil disimpan",
        description: "Perubahan profil kamu sudah tersimpan.",
      });
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({
        title: "Gagal menyimpan",
        description: "Coba lagi beberapa saat lagi.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* 🎬 background like Index */}
      <BackgroundVideo
        src={`${BASE}/videos/Maintheme.mp4`}
    poster={`${BASE}/videos/Maintheme.jpg`}
    overlayClassName=""
      />
      <div className="fixed inset-0 bg-black/40 -z-10" />

      {/* header – same glass style as tracker, with back-to-tracker button */}
      <header className="fixed inset-x-0 top-0 z-[50] pointer-events-none">
        <div className="container mx-auto px-4 pt-2">
          <div
            className="
              pointer-events-auto
              flex items-center justify-between gap-4
              rounded-2xl border border-white/15
              bg-white/5 bg-gradient-to-r from-white/15 via-white/5 to-white/15
              backdrop-blur-2xl
              px-4 py-3 md:px-6 md:py-4
              shadow-[0_18px_45px_rgba(0,0,0,0.45)]
            "
          >
            {/* Left: logo + title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.jpg"
                  alt="RasakuYa logo"
                  className="h-9 w-9 md:h-10 md:w-10 rounded-xl object-cover"
                />
                <div className="pointer-events-none absolute inset-0 rounded-xl blur-md bg-primary/40 -z-10" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg md:text-2xl font-semibold text-white tracking-wide">
                  Rasaku<span className="text-primary-glow/90">Ya</span>!
                </h1>
                <p className="hidden md:block text-xs text-white/70">
                  Track your mood • Calm your mind
                </p>
              </div>
            </div>

            {/* Center: Back to tracker button */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-xs font-medium text-white/80 hover:bg-black/40 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke tracker</span>
              </button>
            </div>

            {/* Right: language + account */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
              <AccountDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* content */}
      <main className="container mx-auto px-4 pt-32 pb-16 relative z-10 text-white">
        <h1 className="text-2xl font-semibold mb-6">Pengaturan Akun</h1>

        {/* wrapper to center cards & add spacing between them */}
        <div className="max-w-2xl mx-auto space-y-10">
          {/* Profil card */}
          <Card className="bg-slate-950/70 border border-white/10 shadow-xl w-full rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white/80">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  readOnly
                  className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keamanan card */}
          <Card className="bg-slate-950/70 border border-white/10 shadow-xl w-full rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">Keamanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-white/80">
                  Kata Sandi
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Input
                    id="password"
                    value="••••••••••"
                    readOnly
                    type="password"
                    className="bg-white/5 border-white/30 text-white"
                  />
                  <Button
                    onClick={() => navigate("/auth/update-password")}
                    className="whitespace-nowrap"
                    variant="outline"
                  >
                    Ubah Kata Sandi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

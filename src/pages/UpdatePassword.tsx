import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Globe, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Lang = "en" | "id";
const LS_LANG_KEY = "ry-lang";

// ✅ Make timeout longer here (ms). 90s = 90000
const FALLBACK_TIMEOUT_MS = 90000;

const STRINGS: Record<Lang, Record<string, string>> = {
  id: {
    tagline: "Buat password baru Anda",
    title: "Password Baru",
    descChecking: "Menyiapkan sesi reset password…",
    descReady: "Masukkan password baru untuk akun Anda",
    descNotReady: "Sesi reset belum siap. Jika gagal, minta link reset baru.",
    labelPassword: "Password Baru",
    placeholder: "Minimal 6 karakter",
    btnSave: "Simpan Kata Sandi",
    btnSaving: "Menyimpan...",
    errNotReadyT: "Sesi belum siap",
    errNotReadyD: "Sedang menyiapkan sesi reset. Jika lama, minta link reset baru.",
    errWeakT: "Error",
    errWeakD: "Password minimal 6 karakter.",
    okT: "Berhasil!",
    okD: "Password berhasil diperbarui. Silakan login kembali.",
    failT: "Gagal",
    failD: "Gagal memperbarui password. Silakan coba lagi.",
    invalidLinkT: "Link tidak valid / kedaluwarsa",
    invalidLinkD: "Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link reset yang baru.",
    tip: "Tips: kalau link dari Gmail tidak berhasil, minta link reset baru.",
    lang: "Bahasa",
  },
  en: {
    tagline: "Create your new password",
    title: "New Password",
    descChecking: "Preparing password reset session…",
    descReady: "Enter a new password for your account",
    descNotReady: "Reset session not ready. If it fails, request a new reset link.",
    labelPassword: "New Password",
    placeholder: "Minimum 6 characters",
    btnSave: "Save Password",
    btnSaving: "Saving...",
    errNotReadyT: "Session not ready",
    errNotReadyD: "Still preparing the reset session. If it takes too long, request a new link.",
    errWeakT: "Error",
    errWeakD: "Password must be at least 6 characters.",
    okT: "Success!",
    okD: "Password updated. Please sign in again.",
    failT: "Failed",
    failD: "Could not update password. Please try again.",
    invalidLinkT: "Invalid / expired link",
    invalidLinkD: "This reset link is invalid or has expired. Please request a new one.",
    tip: "Tip: if the Gmail link fails, request a new reset link.",
    lang: "Language",
  },
};

function getLang(): Lang {
  const stored = localStorage.getItem(LS_LANG_KEY);
  return stored === "en" || stored === "id" ? stored : "id";
}
function setLang(l: Lang) {
  localStorage.setItem(LS_LANG_KEY, l);
}

function stripUrl() {
  // remove query + hash so codes/tokens don’t stay in the address bar
  window.history.replaceState({}, document.title, window.location.pathname);
}

function parseRecoveryFromUrl() {
  const url = new URL(window.location.href);

  // new flow
  const code = url.searchParams.get("code");

  // legacy flow
  const hash = url.hash?.startsWith("#") ? url.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");
  const type = hashParams.get("type");

  return { code, access_token, refresh_token, type };
}

/** Full-screen video background (put file in /public/videos/) */
const MainThemeBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      >
        {/* ✅ Recommended: use lowercase filename in /public/videos/maintheme.mp4 */}
        <source src="/videos/maintheme.mp4" type="video/mp4" />
      </video>

      {/* readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/55" />
      <div className="absolute inset-0 [background:radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.75)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  );
};

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lang, _setLang] = useState<Lang>(() => getLang());
  const t = (k: string) => STRINGS[lang][k] || k;

  const [password, setPasswordState] = useState("");
  const [loading, setLoading] = useState(false);

  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // ✅ prevent double-init in React StrictMode dev
  const didInit = useRef(false);

  // ✅ fix stale state inside timeout
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  // keep language in sync with other tabs/pages
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_LANG_KEY) _setLang(getLang());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    const establishSession = async () => {
      setSafe(() => setChecking(true));

      // Case 0: already have a session
      const { data: existing } = await supabase.auth.getSession();
      if (existing?.session) {
        setSafe(() => {
          setReady(true);
          setChecking(false);
        });
        return;
      }

      const { code, access_token, refresh_token, type } = parseRecoveryFromUrl();

      // Case 1: new `?code=` flow
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) console.error("exchangeCodeForSession error:", error);
        if (data?.session) {
          stripUrl();
          setSafe(() => {
            setReady(true);
            setChecking(false);
          });
          return;
        }
      }

      // Case 2: legacy hash flow
      if (type === "recovery" && access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) console.error("setSession error:", error);
        if (data?.session) {
          stripUrl();
          setSafe(() => {
            setReady(true);
            setChecking(false);
          });
          return;
        }
      }

      // Not ready / invalid
      setSafe(() => {
        setReady(false);
        setChecking(false);
      });
    };

    establishSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        stripUrl();
        setReady(true);
        setChecking(false);
      }
      if (event === "SIGNED_OUT") setReady(false);
    });

    // ✅ longer fallback, and uses readyRef so it won’t falsely redirect
    timeoutId = setTimeout(() => {
      if (!readyRef.current) {
        toast({
          title: t("invalidLinkT"),
          description: t("invalidLinkD"),
          variant: "destructive",
        });
        navigate("/auth/forgot-password");
      }
    }, FALLBACK_TIMEOUT_MS);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, toast, lang]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ready) {
      toast({ title: t("errNotReadyT"), description: t("errNotReadyD"), variant: "destructive" });
      return;
    }

    if (!password || password.length < 6) {
      toast({ title: t("errWeakT"), description: t("errWeakD"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: t("okT"), description: t("okD") });

      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      console.error("Password update failed:", err);
      toast({
        title: t("failT"),
        description: err?.message ?? t("failD"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const next: Lang = lang === "id" ? "en" : "id";
    _setLang(next);
    setLang(next);
  };

  return (
    <>
      <MainThemeBackground />

      {/* top-right language toggle */}
      <div className="fixed right-4 top-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/15"
          onClick={toggleLang}
        >
          <Globe className="h-4 w-4" />
          {t("lang")}: {lang.toUpperCase()}
        </Button>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="/logo.jpg"
                alt="RasakuYa logo"
                // ✅ object-cover prevents “squeezed” look
                className="h-10 w-10 rounded-xl ring-1 ring-white/25 shadow-[0_12px_30px_rgba(0,0,0,0.35)] object-cover"
              />
              <h1 className="text-3xl font-bold text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                RasakuYa!
              </h1>
              <Sparkles className="h-6 w-6 text-sky-200" />
            </div>
            <p className="text-white/80">{t("tagline")}</p>
          </div>

          {/* Glass card */}
          <Card className="shadow-[0_18px_45px_rgba(0,0,0,0.45)] border-white/15 bg-white/10 backdrop-blur-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-white">{t("title")}</CardTitle>
              <CardDescription className="text-white/70">
                {checking ? t("descChecking") : ready ? t("descReady") : t("descNotReady")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90">
                    {t("labelPassword")}
                  </Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/55" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("placeholder")}
                      value={password}
                      onChange={(e) => setPasswordState(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white"
                  disabled={!ready || loading}
                >
                  {loading ? t("btnSaving") : t("btnSave")}
                </Button>
              </form>

              {!checking && !ready && (
                <div className="mt-4 text-xs text-white/60">{t("tip")}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;

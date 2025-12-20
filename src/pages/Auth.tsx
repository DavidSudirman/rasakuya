import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Sparkles, Mail, Lock, User, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type Lang = 'en' | 'id';

const LS_LANG_KEY = 'ry-lang';
const LS_INTRO_SEEN = 'ry-intro-seen';

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    appTagline: 'Track your feelings, predict tomorrow',
    headerWelcome: 'Welcome',
    cardDesc: 'Sign in or sign up to start tracking your mood',
    tabLogin: 'Sign In',
    tabSignup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    displayName: 'Display Name',
    forgot: 'Forgot password?',
    loginBtn: 'Sign In',
    signupBtn: 'Create Account',
    signupNamePh: 'Your name',
    emailPh: 'name@email.com',
    passwordPh: 'Your password',
    signupPasswordPh: 'Minimum 6 characters',

    // ✅ NEW: legal consent
    agreePrefix: 'I agree to the',
    agreeAnd: 'and',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    agreeRequired: 'You must agree to the Terms and Privacy Policy to continue.',

    // (we’ll replace tosLine at bottom with actual links)
    tosLine: 'By signing up, you agree to our terms and conditions',

    // toasts
    errFill: 'Please fill in email and password.',
    errFillAll: 'Please complete all fields.',
    errWeak: 'Password must be at least 6 characters.',
    signInOkT: 'Signed in!',
    signInOkD: 'Welcome back to RasakuYa!',
    signInBadT: 'Sign in failed',
    signInBadD: 'There was an error while signing in.',
    signInInvalid: 'Email or password is incorrect.',
    signInUnconfirmed: 'Please confirm your email first.',
    signUpOkT: 'Signed up!',
    signUpOkD: 'Account created. Please check your email to confirm.',
    signUpBadT: 'Sign up failed',
    signUpBadD: 'There was an error while signing up.',
    signUpDuplicate: 'Email already registered. Use another email or sign in.',
    intro1: 'Hi.',
    intro2: 'Welcome to RasakuYa.',
    intro3: "We are Indonesia's mood tracker and AI mood companion",
    introQ: 'Choose your language',
    english: 'English',
    indonesian: 'Indonesian',
    langSwitcher: 'Language',
  },
  id: {
    appTagline: 'Lacak perasaanmu, prediksi hari esok',
    headerWelcome: 'Selamat datang',
    cardDesc: 'Masuk atau daftar untuk mulai melacak mood Anda',
    tabLogin: 'Masuk',
    tabSignup: 'Daftar',
    email: 'Email',
    password: 'Password',
    displayName: 'Nama Tampilan',
    forgot: 'Lupa password?',
    loginBtn: 'Masuk',
    signupBtn: 'Daftar',
    signupNamePh: 'Nama Anda',
    emailPh: 'nama@email.com',
    passwordPh: 'Password Anda',
    signupPasswordPh: 'Minimal 6 karakter',

    // ✅ NEW: legal consent
    agreePrefix: 'Saya setuju dengan',
    agreeAnd: 'dan',
    terms: 'Syarat & Ketentuan',
    privacy: 'Kebijakan Privasi',
    agreeRequired: 'Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi untuk melanjutkan.',

    tosLine: 'Dengan mendaftar, Anda menyetujui syarat dan ketentuan kami',

    // toasts
    errFill: 'Silakan isi email dan password.',
    errFillAll: 'Silakan lengkapi semua field.',
    errWeak: 'Password harus minimal 6 karakter.',
    signInOkT: 'Berhasil masuk!',
    signInOkD: 'Selamat datang kembali di RasakuYa!',
    signInBadT: 'Gagal masuk',
    signInBadD: 'Terjadi kesalahan saat masuk.',
    signInInvalid: 'Email atau password salah.',
    signInUnconfirmed: 'Silakan konfirmasi email Anda terlebih dahulu.',
    signUpOkT: 'Berhasil mendaftar!',
    signUpOkD: 'Akun Anda telah dibuat. Silakan cek email untuk konfirmasi.',
    signUpBadT: 'Gagal mendaftar',
    signUpBadD: 'Terjadi kesalahan saat mendaftar.',
    signUpDuplicate: 'Email sudah terdaftar. Gunakan email lain atau masuk.',
    intro1: 'Halo.',
    intro2: 'Selamat datang di RasakuYa.',
    intro3: 'Kami adalah pelacak mood & AI mood pendamping',
    introQ: 'Pilih bahasa Anda',
    english: 'Inggris',
    indonesian: 'Indonesia',
    langSwitcher: 'Bahasa',
  }
};

function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LS_LANG_KEY) as Lang) || 'id');
  const set = (l: Lang) => {
    setLang(l);
    localStorage.setItem(LS_LANG_KEY, l);
  };
  return [lang, set];
}

/** Full-screen video background (Supabase Storage public URL) */
const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

const BackgroundVideo = () => {
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
        <source src={`${BASE}/videos/rasakuya-bg.mp4`} type="video/mp4" />
      </video>

      {/* Optional overlay */}
      <div className="absolute inset-0 bg-white/20" />
    </div>
  );
};

/** Bilingual intro (EN on top, ID below). */
const IntroOverlay = ({ onSelect }: { onSelect: (l: Lang) => void }) => {
  const [step, setStep] = useState(0); // 0..2 lines, 3 = language chooser

  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStep(1), 900));
    timers.push(window.setTimeout(() => setStep(2), 3000));
    timers.push(window.setTimeout(() => setStep(3), 9000));
    return () => timers.forEach(clearTimeout);
  }, []);

  const FADE = 0.45;

  const duals = [
    { en: STRINGS.en.intro1, id: STRINGS.id.intro1 },
    { en: STRINGS.en.intro2, id: STRINGS.id.intro2 },
    { en: STRINGS.en.intro3, id: STRINGS.id.intro3 },
  ];

  const idx = Math.min(step, 2);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="max-w-3xl w-full px-6 text-center">
        <AnimatePresence mode="wait">
          {step < 3 && (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: FADE }}
              className="space-y-3"
            >
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                {duals[idx].en}
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground">
                {duals[idx].id}
              </p>
            </motion.div>
          )}

          {step >= 3 && (
            <motion.div
              key="lang-choice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: FADE }}
              className="space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold">
                {STRINGS.en.introQ} / {STRINGS.id.introQ}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <Button
                  className="px-6 py-5 text-base"
                  onClick={() => {
                    localStorage.setItem(LS_INTRO_SEEN, '1');
                    onSelect('en');
                  }}
                >
                  {STRINGS.en.english}
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-5 text-base"
                  onClick={() => {
                    localStorage.setItem(LS_INTRO_SEEN, '1');
                    onSelect('id');
                  }}
                >
                  {STRINGS.id.indonesian}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Auth = () => {
  const [lang, setLang] = useLang();
  const t = (k: string) => STRINGS[lang][k] || k;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showIntro, setShowIntro] = useState<boolean>(() => !localStorage.getItem(LS_INTRO_SEEN));

  // ✅ NEW: legal agreement checkbox (signup only)
  const [agreeToLegal, setAgreeToLegal] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/');
    };
    checkUser();
  }, [navigate]);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: t('errFill'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        toast({ title: t('signInOkT'), description: t('signInOkD') });
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Sign in error raw:', error);
      let msg = t('signInBadD');
      if (error?.message?.includes('Invalid login credentials')) msg = t('signInInvalid');
      else if (error?.message?.includes('Email not confirmed')) msg = t('signInUnconfirmed');
      toast({ title: t('signInBadT'), description: error?.message ?? msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ NEW: block signup unless agreed
    if (!agreeToLegal) {
      toast({ title: 'Error', description: t('agreeRequired'), variant: 'destructive' });
      return;
    }

    if (!email || !password || !displayName) {
      toast({ title: 'Error', description: t('errFillAll'), variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: t('errWeak'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}

      // redirect to callback (works for localhost & prod)
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: displayName }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({ title: t('signUpOkT'), description: t('signUpOkD') });
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Sign up error raw:', error);
      let msg = t('signUpBadD');
      if (error?.message?.includes('User already registered')) msg = t('signUpDuplicate');
      else if (error?.message?.includes('Password should be at least')) msg = t('errWeak');
      else if (error?.message?.toLowerCase?.()?.includes('redirect')) msg = 'Redirect URL not allowed in Supabase. Add your /auth/callback to Redirect URLs.';
      else if (error?.message?.toLowerCase?.()?.includes('signups not allowed')) msg = 'Email signups are disabled in Supabase.';
      toast({ title: t('signUpBadT'), description: error?.message ?? msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackgroundVideo />

      <div className="fixed right-4 top-4 z-40">
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
        >
          <Globe className="h-4 w-4" />
          {STRINGS[lang].langSwitcher}: {lang.toUpperCase()}
        </Button>
      </div>

      {showIntro && <IntroOverlay onSelect={(l) => { setLang(l); setShowIntro(false); }} />}

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">RasakuYa!</h1>
              <Sparkles className="h-6 w-6 text-primary-glow" />
            </div>
            <p className="text-white">{t('appTagline')}</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{t('headerWelcome')}</CardTitle>
              <CardDescription>{t('cardDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={isLogin ? 'login' : 'signup'}
                onValueChange={(v) => {
                  const nextIsLogin = v === 'login';
                  setIsLogin(nextIsLogin);

                  // ✅ reset checkbox when entering signup
                  if (!nextIsLogin) setAgreeToLegal(false);
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t('tabLogin')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('tabSignup')}</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('emailPh')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder={t('passwordPh')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Link
                        to="/auth/forgot-password"
                        className="text-sm text-primary hover:text-primary/80 hover:underline"
                      >
                        {t('forgot')}
                      </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (lang === 'id' ? 'Sedang masuk…' : 'Signing in…') : t('loginBtn')}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">{t('displayName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder={t('signupNamePh')}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t('emailPh')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder={t('signupPasswordPh')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    {/* ✅ NEW: Required checkbox + links */}
                    <div className="flex items-start gap-3 rounded-lg border border-white/20 bg-white/10 p-3">
                      <input
                        id="agree-legal"
                        type="checkbox"
                        checked={agreeToLegal}
                        onChange={(e) => setAgreeToLegal(e.target.checked)}
                        className="mt-1 h-4 w-4 accent-white"
                      />
                      <Label htmlFor="agree-legal" className="text-sm text-white leading-snug cursor-pointer">
                        {t('agreePrefix')}{' '}
                        <Link to="/terms" className="underline underline-offset-4 hover:text-white/90">
                          {t('terms')}
                        </Link>{' '}
                        {t('agreeAnd')}{' '}
                        <Link to="/privacy" className="underline underline-offset-4 hover:text-white/90">
                          {t('privacy')}
                        </Link>
                        .
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !agreeToLegal}>
                      {loading ? (lang === 'id' ? 'Sedang mendaftar…' : 'Creating…') : t('signupBtn')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* ✅ Replace old tosLine with real clickable links */}
          <p className="text-center text-sm text-white mt-6">
            <Link to="/terms" className="underline underline-offset-4 hover:text-white/90">
              {t('terms')}
            </Link>
            {' • '}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-white/90">
              {t('privacy')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;

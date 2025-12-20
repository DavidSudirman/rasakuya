// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { MonthlyReviewPrompt } from "@/components/MonthlyReviewPrompt";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Chat from "./pages/Chat";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Profile from "./pages/profile"; // ⬅️ note the lowercase p

// ✅ NEW: legal pages
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Pricing from "./pages/Pricing";
import Refund from "./pages/Refund";
// ✅ If you have Pricing.tsx, keep this import.
// If your pricing page is named differently, adjust the import/path.


import { ArunaChatTabs } from "@/components/ArunaChatTabs";
import OnboardingTherapist from "@/pages/OnboardingTherapist";
import OnboardingGuard from "@/components/OnboardingGuard";

import { IntroSequence } from "@/components/IntroSequence";
import { useAuth as useAuthHook } from "@/hooks/useAuth";
import Questioning from "./pages/Questioning";

const queryClient = new QueryClient();

// Separate component so we can read the current pathname
const AppRoutes = () => {
  const { pathname } = useLocation();
  const normalized = (pathname || "/").replace(/\/+$/, "") || "/";

  // ✅ Only show the intro on the home route "/"
  const shouldShowIntro = normalized === "/";

  return (
    <>
      {shouldShowIntro && <IntroSequence />}

      <Routes>
        <Route path="/" element={<Index />} />

        {/* Auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/update-password" element={<UpdatePassword />} />

        {/* ✅ Public commerce/legal */}
        
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/questioning" element={<Questioning />} />
        <Route path="/refund" element={<Refund />} />

        {/* App */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/onboarding" element={<OnboardingTherapist />} />
        <Route
          path="/ai-therapist"
          element={
            <OnboardingGuard>
              <ArunaChatTabs moodEntries={[]} />
            </OnboardingGuard>
          }
        />
        <Route path="/chat" element={<Chat />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* ⬇️ Monthly review only for logged-in users on internal pages */}
      <AuthedMonthlyReview />
    </>
  );
};

const AuthedMonthlyReview = () => {
  const { pathname } = useLocation();
  const { user, loading } = useAuthHook(); // from AuthProvider

  // Pages where we NEVER want to show the popup
  const publicPaths = [
    "/",
    "/auth",
    "/auth/forgot-password",
    "/auth/update-password",
    "/auth/callback",
    "/pricing",
    "/terms",
    "/privacy",
    "/refund",
  ];

  if (loading) return null;                     // still checking auth
  if (!user) return null;                       // not logged in
  if (publicPaths.includes(pathname)) return null; // on public page

  return (
    <MonthlyReviewPrompt appVersion={import.meta.env.VITE_APP_VERSION} />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {/* Global background */}
          <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
              backgroundImage: "url('/themes/trees-bg.png')",
              backgroundPosition: "center top",
              backgroundSize: "cover",
            }}
          >
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

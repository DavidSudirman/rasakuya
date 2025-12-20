import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white">
      {/* ✅ Fixed background video (no scrolling outside) */}
      <div className="fixed inset-0 -z-10">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={`${BASE}/videos/rasakuya-bg.mp4`} type="video/mp4" />
        </video>

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back to Auth */}
        <div className="mb-4">
          <Button
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Auth
          </Button>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Terms of Service
          </h1>

          <p className="text-white/70 mt-2">
            Last updated: {new Date().toISOString().slice(0, 10)}
          </p>

          <div className="mt-8 space-y-6 text-white/85 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white">1. About RasakuYa</h2>
              <p className="mt-2">
                RasakuYa is a mood tracking and wellbeing companion app. It helps you
                log emotions, reflect on patterns, and access AI-powered supportive
                conversations for self-reflection and general wellbeing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Not Medical Advice</h2>
              <p className="mt-2">
                RasakuYa is <span className="font-semibold">not</span> a medical
                service and does not provide diagnosis, treatment, or clinical
                therapy. If you are in crisis, consider reaching out to local
                emergency services or a qualified professional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Eligibility</h2>
              <p className="mt-2">
                You must be able to form a legally binding agreement in your
                jurisdiction to use RasakuYa. If you are under the age of majority,
                use RasakuYa with permission from a parent or guardian.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Account and Security</h2>
              <p className="mt-2">
                You are responsible for maintaining the confidentiality of your
                credentials and for all activity that occurs under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Acceptable Use</h2>
              <p className="mt-2">
                You agree not to misuse RasakuYa, including attempting to disrupt
                the service, bypass limits, reverse engineer, scrape, or use it for
                illegal or harmful activity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. AI Features</h2>
              <p className="mt-2">
                Some features generate responses using AI. Outputs may be inaccurate
                or incomplete. Use your judgment and do not rely on AI output as
                professional advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                7. Subscriptions and Billing
              </h2>
              <p className="mt-2">
                If you purchase a subscription, you authorize billing according to
                the plan selected. Pricing, features, and limits may change over
                time and will be shown on our pricing page and/or in-app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Refunds</h2>
              <p className="mt-2">
                Refund rules are described in our Refund Policy. In case of conflict,
                the Refund Policy controls for refund decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. Privacy</h2>
              <p className="mt-2">
                Our Privacy Policy explains how we collect, use, and protect
                information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                10. Changes to These Terms
              </h2>
              <p className="mt-2">
                We may update these Terms from time to time. Continued use after
                changes become effective means you accept the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">11. Contact</h2>
              <p className="mt-2">
                Questions? Contact us at{" "}
                <span className="font-semibold">rasakuyaa@gmail.com</span>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

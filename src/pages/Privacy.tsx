import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white">
      {/* ✅ Fixed background video (cannot scroll outside) */}
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
            Privacy Policy
          </h1>

          <p className="text-white/70 mt-2">
            Last updated: {new Date().toISOString().slice(0, 10)}
          </p>

          <div className="mt-8 space-y-6 text-white/85 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white">
                1. What We Collect
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Account data</span> (email, user
                  ID, profile name)
                </li>
                <li>
                  <span className="font-semibold">Mood entries</span> (mood, notes,
                  dates, optional metadata)
                </li>
                <li>
                  <span className="font-semibold">Usage data</span> (basic analytics
                  and error logs)
                </li>
                <li>
                  <span className="font-semibold">AI chat content</span> if you use
                  AI features
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                2. How We Use Data
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>To provide and improve RasakuYa</li>
                <li>To show mood history and insights</li>
                <li>To operate AI features on request</li>
                <li>For security and fraud prevention</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                3. AI Processing
              </h2>
              <p className="mt-2">
                Some input may be processed by AI service providers to generate
                responses. Only required data is sent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                4. Data Storage & Security
              </h2>
              <p className="mt-2">
                Data is stored securely using Supabase infrastructure. No system is
                guaranteed to be 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                5. Sharing
              </h2>
              <p className="mt-2">
                We do not sell personal data. We only share data with essential
                service providers (hosting, AI, payments).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                6. Your Choices
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>Edit or delete mood entries</li>
                <li>Request account deletion</li>
                <li>Disable AI features at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                7. Children
              </h2>
              <p className="mt-2">
                RasakuYa is not intended for children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                8. Changes
              </h2>
              <p className="mt-2">
                Continued use after updates means acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                9. Contact
              </h2>
              <p className="mt-2">
                Contact:{" "}
                <span className="font-semibold">rasakuyaa@gmail.com</span>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

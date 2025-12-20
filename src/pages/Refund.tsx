import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Refund() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white">
      {/* Fixed background video */}
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
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back button */}
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
            Refund Policy
          </h1>
          <p className="text-white/70 mt-2">
            Last updated: {new Date().toISOString().slice(0, 10)}
          </p>

          <div className="mt-8 space-y-6 text-white/85 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white">1. Overview</h2>
              <p className="mt-2">
                RasakuYa is a digital subscription service. By purchasing a plan,
                you receive immediate access to premium features and content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Subscription Payments</h2>
              <p className="mt-2">
                Payments are billed in advance on a monthly basis. Once a billing
                period begins, it cannot be partially refunded.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Refund Eligibility</h2>
              <p className="mt-2">
                Because RasakuYa provides instant digital access, refunds are
                generally not offered after a subscription has started, except
                where required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Exceptional Cases</h2>
              <p className="mt-2">
                We may consider refunds on a case-by-case basis for issues such as:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>Accidental duplicate charges</li>
                <li>Technical errors preventing access to paid features</li>
                <li>Billing issues caused by our payment provider</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. How to Request a Refund</h2>
              <p className="mt-2">
                To request a refund review, contact us at{" "}
                <span className="font-semibold">rasakuyaa@gmail.com</span> with
                your account email and payment details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Subscription Cancellation</h2>
              <p className="mt-2">
                You may cancel your subscription at any time. Cancellation stops
                future billing but does not refund the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. Changes to This Policy</h2>
              <p className="mt-2">
                We may update this Refund Policy from time to time. Continued use
                of RasakuYa after changes means you accept the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Contact</h2>
              <p className="mt-2">
                Questions about refunds? Contact us at{" "}
                <span className="font-semibold">rasakuyaa@gmail.com</span>.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

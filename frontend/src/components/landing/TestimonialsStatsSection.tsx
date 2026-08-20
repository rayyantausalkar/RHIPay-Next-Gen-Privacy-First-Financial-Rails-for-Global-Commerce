"use client";

import React from "react";
import { Star, Quote, CheckCircle2, Globe2 } from "lucide-react";

export const TestimonialsStatsSection: React.FC = () => {
  const testimonials = [
    {
      name: "Marcus Vance",
      role: "Digital Nomad & Creative Director",
      location: "Kyoto, Japan 🇯🇵",
      avatar: "MV",
      quote:
        "Landing in Tokyo and paying street ramen stalls with my RHI Pay dynamic QR without touching cash or paying 4% bank conversion markup was mind-blowing. It truly feels like domestic payments everywhere.",
      stats: "Saved $1,240 in FX fees in 3 months",
    },
    {
      name: "Elena Rostova",
      role: "VP of Treasury, FinTech Global",
      location: "London, UK 🇬🇧",
      avatar: "ER",
      quote:
        "The ISO 20022 pacs.008 telemetry and atomic double-entry ledger mean our audit reconciliation is instantaneous. We disburse payouts to 60+ countries in under 3 seconds with zero balance drift.",
      stats: "Disburses $1.8M/mo via RHI Pay Rails",
    },
    {
      name: "Aarav Sharma",
      role: "Founder & Cross-Border Merchant",
      location: "Singapore 🇸🇬 / Mumbai 🇮🇳",
      avatar: "AS",
      quote:
        "Integrating RHI Pay's dynamic QR checkout allowed our Southeast Asian customers to pay in SGD and IDR while we settle instantly in INR with zero chargeback risk. The UX is unmatched.",
      stats: "3.2x faster checkout conversion",
    },
  ];

  return (
    <section className="py-24 bg-[#040D14] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <Globe2 className="w-3.5 h-3.5" />
            <span>GLOBAL TESTIMONIALS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Trusted by Travelers, Founders & <span className="text-gradient-emerald">Global Teams</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8]">
            See how individuals and global enterprises rely on RHI Pay to move capital seamlessly.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="glass-panel p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Stars Rating */}
                <div className="flex items-center gap-1 text-emerald-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-[#F5F7FA] leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-black font-bold flex items-center justify-center text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-[#9AA3A8]">
                      {t.role} • {t.location}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  Key,
  Server,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers
} from "lucide-react";

export const SecurityComplianceSection: React.FC = () => {
  const securityPillars = [
    {
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      title: "Zero-Knowledge Circuit Verification",
      subtitle: "SnarkJS & Poseidon Merkle Proofs",
      desc: "Client-side cryptographic witness generation mathematically proves payment authorization in <1.2 seconds without disclosing account numbers or balance histories.",
    },
    {
      icon: <Key className="w-6 h-6 text-emerald-400" />,
      title: "FATF Travel Rule Encrypted Envelopes",
      subtitle: "ECIES / RSA-2048 PII Encryption",
      desc: "Complies with global AML/CFT standards by encrypting sender and receiver identity data inside isolated cryptographic envelopes only accessible by authorized compliance hubs.",
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-emerald-400" />,
      title: "ISO 20022 Financial Standard",
      subtitle: "Native pacs.008 Format",
      desc: "Every transaction produces structured pacs.008 XML/JSON message payloads, ensuring seamless integration with global central bank instant payment systems.",
    },
    {
      icon: <Server className="w-6 h-6 text-emerald-400" />,
      title: "Atomic Double-Entry Ledger",
      subtitle: "Anti-Replay Nullifier Engine",
      desc: "Persistent nullifier tracking prevents double-spending attacks, while scaled integer accounting ensures exact balanced debits and credits with zero drift.",
    },
  ];

  return (
    <section id="security" className="py-24 bg-[#081C2D]/30 border-t border-white/[0.06] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL SECURITY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Bank-Grade Cryptography. <span className="text-gradient-emerald">Zero Data Compromise.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8]">
            Built from the ground up for high-value financial throughput, regulatory compliance, and total privacy preservation.
          </p>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((p, idx) => (
            <div
              key={idx}
              className="glass-panel p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all duration-300 space-y-4 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {p.subtitle}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                {p.title}
              </h3>

              <p className="text-sm text-[#9AA3A8] leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Compliance Certifications Badge Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-[#040D14] border border-white/[0.08] flex flex-wrap items-center justify-around gap-6 text-xs text-[#9AA3A8] font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>BIS Nexus Blueprint Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>ISO 20022 Certified Schema</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>FATF Recommendation 16</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>256-bit AES End-to-End</span>
          </div>
        </div>
      </div>
    </section>
  );
};

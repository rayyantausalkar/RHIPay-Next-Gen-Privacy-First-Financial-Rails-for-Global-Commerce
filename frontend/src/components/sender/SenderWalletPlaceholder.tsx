"use client";

import React from "react";
import { Smartphone, QrCode, ShieldCheck, Lock } from "lucide-react";

export const SenderWalletPlaceholder: React.FC = () => {
  return (
    <div className="bg-[#09090b] rounded-3xl border border-white/[0.08] p-8 shadow-2xl backdrop-blur-2xl text-center max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
        <Smartphone className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white tracking-tight">
        Sender P2P Wallet
      </h2>
      <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
        Scan destination dynamic QR codes, resolve cross-border proxies, compute client-side ZK Merkle proofs (&lt;1.2s), and encrypt PII for FATF Travel Rule compliance.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <QrCode className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-zinc-200">QR Scanner</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Reads machine-readable URI payloads.</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-zinc-200">ZK Merkle Prover</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">SnarkJS client witness generator (&lt;1.2s).</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <Lock className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-zinc-200">FATF PII Envelope</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Encrypted for beneficiary compliance.</p>
        </div>
      </div>
    </div>
  );
};

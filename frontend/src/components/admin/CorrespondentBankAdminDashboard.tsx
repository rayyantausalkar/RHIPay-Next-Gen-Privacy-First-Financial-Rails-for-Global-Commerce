"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Send,
  Lock,
  Layers,
  Landmark,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, AdminUserItem } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

interface JourneyAdminItem {
  id?: number;
  request_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  home_country: string;
  home_currency: string;
  bank_name: string;
  destination_country: string;
  destination_currency: string;
  purpose_of_travel: string;
  start_date: string;
  end_date: string;
  home_amount_requested: number;
  destination_amount_calculated: number;
  exchange_rate: number;
  passport_data_url?: string | null;
  passport_filename?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const STAGES = [
  { id: "ingest", label: "Verify Payee", short: "Payee" },
  { id: "quote", label: "FX Rate Lock", short: "Rate" },
  { id: "zkp", label: "ZK Prover", short: "ZK Proof" },
  { id: "nullifier", label: "Nullifier", short: "Nullifier" },
  { id: "envelope", label: "FATF Envelope", short: "Envelope" },
  { id: "iso20022", label: "ISO 20022", short: "ISO 20022" },
  { id: "gateway", label: "API Gateway", short: "Gateway" },
  { id: "routing", label: "Stream Routing", short: "Routing" },
  { id: "merkle", label: "Merkle Root", short: "Merkle" },
  { id: "groth16", label: "Circuit Verifier", short: "Groth16" },
  { id: "anti_replay", label: "Anti-Replay", short: "Anti-Replay" },
  { id: "crypto_gate", label: "Crypto Gate", short: "Gate" },
  { id: "spoke_a", label: "Spoke A Debit", short: "Spoke A" },
  { id: "fx_swap", label: "Atomic FX Swap", short: "FX Swap" },
  { id: "spoke_b", label: "Spoke B Credit", short: "Spoke B" },
  { id: "travel_rule", label: "FATF Dispatch", short: "FATF" },
  { id: "enclave_decryption", label: "Enclave Decrypt", short: "Enclave" },
  { id: "sanctions_screening", label: "AML Sanctions", short: "AML" },
  { id: "ledger_commit", label: "Ledger Commitment", short: "Ledger" },
  { id: "compliance_archival", label: "WORM Archival", short: "Archive" },
  { id: "push_notify", label: "Recipient Push", short: "Push" },
  { id: "sender_receipt", label: "Digital Receipt", short: "Receipt" },
];

export const CorrespondentBankAdminDashboard: React.FC = () => {
  const { user, getAllUsers, toggleBlockUser } = useAuth();
  const { broadcastNotification } = useNotifications();

  const [activeAdminTab, setActiveAdminTab] = useState<"telemetry" | "journeys" | "users" | "broadcast">("journeys");
  const [journeyRequests, setJourneyRequests] = useState<JourneyAdminItem[]>([]);
  const [userList, setUserList] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<JourneyAdminItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Passport preview modal state
  const [previewPassportUrl, setPreviewPassportUrl] = useState<string | null>(null);

  // Broadcast announcement state
  const [broadcastTitle, setBroadcastTitle] = useState<string>("");
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");

  // Live telemetry stream simulator
  const [telemetryActiveIdx, setTelemetryActiveIdx] = useState<number>(21);
  const [isSimulatingTx, setIsSimulatingTx] = useState<boolean>(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Journey requests
      const jRes = await fetch(`${API_BASE}/journey/admin/requests`);
      if (jRes.ok) {
        const jData = await jRes.json();
        setJourneyRequests(jData);
      }

      // 2. Fetch User list
      const uData = await getAllUsers();
      setUserList(uData);
    } catch (err) {
      console.warn("Failed to fetch admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveJourney = async (requestId: string) => {
    try {
      const res = await fetch(`${API_BASE}/journey/admin/approve/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: user?.email || "admin.rhipay@gmail.com" }),
      });
      if (res.ok) {
        toast.success("Travel Journey Request Approved!", {
          description: "Funds credited to user travel balance and notification dispatched.",
        });
        fetchAdminData();
      } else {
        toast.error("Failed to approve request");
      }
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      toast.error("Compulsory rejection reason is required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/journey/admin/reject/${rejectingItem.request_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email: user?.email || "admin.rhipay@gmail.com",
          rejection_reason: rejectionReason.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Journey Request Rejected", {
          description: "Notification with reason dispatched to user.",
        });
        setRejectingItem(null);
        setRejectionReason("");
        fetchAdminData();
      } else {
        toast.error("Failed to reject request");
      }
    } catch (err: any) {
      toast.error(err.message || "Rejection failed");
    }
  };

  const handleToggleBlock = async (userId: string) => {
    const res = await toggleBlockUser(userId);
    if (res.success) {
      toast.success(res.is_blocked ? "User account BLOCKED" : "User account UNBLOCKED");
      fetchAdminData();
    } else {
      toast.error(res.error || "Failed to toggle block status");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please provide both title and message.");
      return;
    }

    const success = await broadcastNotification(broadcastTitle, broadcastMessage, "ADMIN_ALERT", "ALL");
    if (success) {
      setBroadcastTitle("");
      setBroadcastMessage("");
    }
  };

  const runTelemetrySimulation = async () => {
    setIsSimulatingTx(true);
    for (let i = 0; i < STAGES.length; i++) {
      setTelemetryActiveIdx(i);
      await new Promise((r) => setTimeout(r, 160));
    }
    setIsSimulatingTx(false);
    toast.success("All 22 Automated Validation Tests Passed in 3.48s!");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-[#0b1c2b] to-[#06121c] border border-amber-500/30 p-4 sm:p-5 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Correspondent Bank Control Room
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full font-mono">
                ADMIN AUTHORITY
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Review travel exchange requests, monitor real-time validation checks & manage spoke network
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/[0.08] overflow-x-auto">
          {[
            { id: "journeys", label: "Travel Review", count: journeyRequests.filter((j) => j.status === "PENDING").length },
            { id: "telemetry", label: "Live Telemetry" },
            { id: "users", label: "User Directory" },
            { id: "broadcast", label: "Broadcast" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === tab.id
                  ? "bg-amber-500 text-black shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Travel / Journey Currency Requests Queue */}
      {activeAdminTab === "journeys" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Pending & Past Travel Currency Requests ({journeyRequests.length})
            </h3>
            <button onClick={fetchAdminData} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {journeyRequests.length === 0 ? (
            <div className="py-16 text-center bg-zinc-950/40 border border-white/[0.06] rounded-3xl">
              <p className="text-sm font-semibold text-zinc-400">No travel exchange requests currently in queue</p>
            </div>
          ) : (
            journeyRequests.map((req) => {
              const isPending = req.status === "PENDING";
              const isApproved = req.status === "APPROVED";

              return (
                <div
                  key={req.request_id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    isPending
                      ? "bg-[#091b26] border-amber-500/40 shadow-lg shadow-amber-950/20"
                      : "bg-zinc-950/60 border-white/[0.06]"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{req.user_name}</span>
                        <span className="text-xs text-zinc-400 font-mono">({req.user_email})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            isPending
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : isApproved
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{req.bank_name}</span>
                        </span>
                        <span>•</span>
                        <span>Destination: <strong className="text-white">{req.destination_country}</strong> ({req.destination_currency})</span>
                        <span>•</span>
                        <span>Dates: <strong>{req.start_date}</strong> to <strong>{req.end_date}</strong></span>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Requested Amount</span>
                          <span className="font-mono font-bold text-emerald-300 text-sm">
                            {req.destination_currency} {req.destination_amount_calculated.toLocaleString()}
                          </span>{" "}
                          <span className="text-zinc-400 text-[10px]">
                            ({req.home_currency} {req.home_amount_requested.toLocaleString()})
                          </span>
                        </div>

                        {/* Passport document trigger */}
                        <div className="pl-4 border-l border-white/10">
                          <span className="text-[10px] text-zinc-400 block">Passport Document</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPassportUrl(req.passport_data_url || "data:image/png;base64,demo")
                            }
                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>View {req.passport_filename || "Passport Scan"}</span>
                          </button>
                        </div>
                      </div>

                      {req.rejection_reason && (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                          <strong>Rejection Reason:</strong> {req.rejection_reason}
                        </div>
                      )}
                    </div>

                    {/* Actions if Pending */}
                    {isPending && (
                      <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handleApproveJourney(req.request_id)}
                          className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/30 flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Credit Balance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectingItem(req);
                            setRejectionReason("");
                          }}
                          className="px-4 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject with Reason</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Live Real-Time Telemetry Stream (22 Pipeline Checks from Image) */}
      {activeAdminTab === "telemetry" && (
        <div className="space-y-4">
          <div className="bg-zinc-950/80 border border-white/[0.08] p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Automated Payment Verification Engine</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Visualizes all 22 AML, ZKP, and ISO 20022 compliance checks executing automatically within 3–5 seconds
                </p>
              </div>

              <button
                onClick={runTelemetrySimulation}
                disabled={isSimulatingTx}
                className="px-4 py-2 rounded-2xl bg-emerald-500 text-black font-bold text-xs shadow-md shadow-emerald-500/30 hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isSimulatingTx ? "Executing Pipeline..." : "Simulate 3-5s Transaction"}</span>
              </button>
            </div>

            {/* 22 Telemetry Chips matching user's image */}
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 shadow-inner">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
                {STAGES.map((st, idx) => {
                  const isPassed = idx < telemetryActiveIdx;
                  const isCurrent = idx === telemetryActiveIdx;

                  return (
                    <div
                      key={st.id}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        isCurrent
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 scale-105"
                          : isPassed
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                          : "bg-white/[0.02] border-white/[0.04] text-zinc-600"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      <span className="text-[8px] font-mono font-bold truncate max-w-full">{st.short}</span>
                      <span className="text-[7px] text-zinc-500 font-mono">PASS</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Directory & Block / Unblock Management */}
      {activeAdminTab === "users" && (
        <div className="space-y-3">
          <div className="px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Registered Clearing Network Users ({userList.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {userList.map((u) => (
              <div
                key={u.user_id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  u.is_blocked ? "bg-rose-950/20 border-rose-500/30" : "bg-zinc-950/60 border-white/[0.06]"
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{u.name}</span>
                    <span className="text-xs text-zinc-400 font-mono">({u.email})</span>
                    {u.is_blocked && (
                      <span className="px-2 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full font-mono">
                        BLOCKED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
                    <span>Bank: <strong className="text-white">{u.bank_name}</strong></span>
                    <span>•</span>
                    <span>Acct: <strong className="font-mono text-emerald-300">{u.account_number}</strong></span>
                    <span>•</span>
                    <span>Country: <strong>{u.home_country}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-xs text-zinc-400">Balance</p>
                    <p className="text-sm font-mono font-bold text-emerald-300">{u.wallet_balance.toLocaleString()}</p>
                  </div>

                  {u.role !== "ADMIN" && (
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(u.user_id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        u.is_blocked
                          ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {u.is_blocked ? "Unblock Account" : "Block Account"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Broadcast Announcements */}
      {activeAdminTab === "broadcast" && (
        <form onSubmit={handleSendBroadcast} className="p-5 rounded-3xl bg-zinc-950/80 border border-white/[0.08] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Broadcast Authority Announcement</h3>
            <p className="text-xs text-zinc-400">Dispatch instant notifications to all active users on the network</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Announcement Title</label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Scheduled Network Upgrade / FX Rate Update"
              className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Message Content</label>
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Details of the announcement..."
              className="w-full p-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/30 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast to All Users</span>
          </button>
        </form>
      )}

      {/* Compulsory Rejection Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#08131d] border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Journey Request</h3>
                <p className="text-xs text-zinc-400">Compulsory reason is required for statutory auditing</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Mandatory Rejection Reason:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Passport validity expiration is within 6 months, or travel amount exceeds regulatory foreign exchange quota."
                className="w-full p-3 rounded-2xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/30"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport Preview Modal */}
      {previewPassportUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#08131d] border border-white/[0.08] rounded-3xl p-5 shadow-2xl text-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Passport Document Preview</span>
              </h3>
              <button
                onClick={() => setPreviewPassportUrl(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/10 flex items-center justify-center min-h-[220px]">
              {previewPassportUrl.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewPassportUrl}
                  alt="Passport Scan"
                  className="max-h-60 rounded-xl object-contain"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                  <p className="text-xs text-zinc-300 font-semibold">Government Passport Document</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Format: Verified PDF Document</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewPassportUrl(null)}
              className="w-full py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

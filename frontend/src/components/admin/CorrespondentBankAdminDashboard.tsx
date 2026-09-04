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
  Receipt,
  Search,
  Check,
  Copy,
  Scale,
  Boxes,
  BellRing,
  Globe,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Play,
  CheckCircle,
  FileText,
  LogOut,
  Zap,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, AdminUserItem, TransactionItem } from "@/context/AuthContext";
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
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  rejection_reason?: string | null;
  created_at: string;
}

interface CorrespondentBankAdminDashboardProps {
  onLogout?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const COUNTRY_FLAGS: Record<string, string> = {
  SG: "🇸🇬",
  IN: "🇮🇳",
  AE: "🇦🇪",
  US: "🇺🇸",
  GB: "🇬🇧",
  EU: "🇪🇺",
  JP: "🇯🇵",
  TH: "🇹🇭",
  MY: "🇲🇾",
  AU: "🇦🇺",
  CA: "🇨🇦",
  BR: "🇧🇷",
};

const NOSTRO_VOSTRO_CORRIDORS = [
  { spoke: "US - Federal Reserve / FedNow Spoke", bic: "CHASUS33", currency: "USD", nostroBalance: "250,000,000.00", vostroBalance: "145,000,000.00", status: "HEALTHY_SYNCHRONIZED", latency: "1.1s" },
  { spoke: "IN - NPCI UPI / IMPS Spoke", bic: "HDFCINBB", currency: "INR", nostroBalance: "12,500,000,000.00", vostroBalance: "8,200,000,000.00", status: "HEALTHY_SYNCHRONIZED", latency: "0.8s" },
  { spoke: "SG - PayNow / FAST Spoke", bic: "DBSGSGSG", currency: "SGD", nostroBalance: "180,000,000.00", vostroBalance: "95,000,000.00", status: "HEALTHY_SYNCHRONIZED", latency: "0.9s" },
  { spoke: "AE - CBUAE IPP / Aani Spoke", bic: "FABAAEAD", currency: "AED", nostroBalance: "650,000,000.00", vostroBalance: "410,000,000.00", status: "HEALTHY_SYNCHRONIZED", latency: "1.2s" },
  { spoke: "GB - Bank of England FPS Spoke", bic: "BARCGB22", currency: "GBP", nostroBalance: "120,000,000.00", vostroBalance: "78,000,000.00", status: "HEALTHY_SYNCHRONIZED", latency: "1.0s" },
  { spoke: "EU - TIPS / SEPA Instant Spoke", bic: "DEUTDEDD", currency: "EUR", nostroBalance: "310,000,000.00", vostroBalance: "190,000,000.00", status: "HEALTHY_SYNCHRONIZED", latency: "1.3s" },
];

export const SIX_MAJOR_TRANSACTION_STEPS = [
  {
    stepNumber: 1,
    id: "beneficiary_resolution",
    title: "1. Beneficiary Resolution & Dynamic ISO Ingestion",
    shortTitle: "1. Payee & ISO Ingest",
    protocol: "ISO 20022 pacs.008.001.10 / HMAC-SHA256",
    actor: "Origin & Destination Spoke IPS Rails",
    duration: "< 45ms",
    description: "Resolves recipient proxy alias (Mobile / VPA / Email / IBAN) against Nexus Spoke directory, retrieves clearing member BIC, and ingests HMAC-SHA256 signed payment request.",
    technicalDetails: [
      "Proxy Lookup & Spoke Routing Resolution (E.164 / RFC-5322)",
      "HMAC-SHA256 Canonical Signature Integrity Validation",
      "ISO 20022 pacs.008.001.10 Schema Compliance & TTL Expiry Check",
      "Dynamic Minor-Unit Decimal & Purpose Code Alignment",
    ],
    badgeColor: "emerald",
  },
  {
    stepNumber: 2,
    id: "zkp_generation",
    title: "2. Client-Side Zero-Knowledge Proof (ZKP) Generation",
    shortTitle: "2. ZKP Groth16 Witness",
    protocol: "Groth16 / BN254 / Poseidon Merkle Root",
    actor: "Sender Client WebAssembly Circuit",
    duration: "< 1.2s",
    description: "Sender client generates a succinct zero-knowledge proof proving account balance sufficiency and Poseidon Merkle tree inclusion without exposing private account numbers or balance amounts.",
    technicalDetails: [
      "Poseidon Hash Merkle Path Inclusion Witness (<1.2s)",
      "Groth16 Constraint System Evaluation (23,840 constraints)",
      "Anonymized Sender Commitment Generation on BN254 curve",
      "Zero-Leakage Private Balance Gating before network dispatch",
    ],
    badgeColor: "cyan",
  },
  {
    stepNumber: 3,
    id: "nullifier_verification",
    title: "3. Anti-Double-Spend Nullifier Registry Verification",
    shortTitle: "3. Anti-Double-Spend",
    protocol: "Cryptographic Nullifier / Nonce Registry",
    actor: "Nexus Central Hub Verification Engine",
    duration: "< 18ms",
    description: "The Central Hub validates the unique cryptographic nullifier against the immutable on-chain nullifier registry, strictly preventing double-spending and historical witness replay attacks.",
    technicalDetails: [
      "Nullifier Hash Uniqueness Check against Storage",
      "Strictly Increasing Monotonic Account Nonce Validation",
      "Hub Merkle Root Freshness & Timestamp Verification",
      "Instant Replay Attack Mitigation & Telemetry Logging",
    ],
    badgeColor: "amber",
  },
  {
    stepNumber: 4,
    id: "fatf_travel_rule",
    title: "4. FATF Travel Rule IVMS-101 Enclave Encryption",
    shortTitle: "4. FATF Travel Rule",
    protocol: "ECIES-Secp256k1 / RSA-4096 / IVMS-101",
    actor: "Correspondent Member Bank Secure Enclaves (TEE)",
    duration: "< 60ms",
    description: "Encrypted originator and beneficiary regulatory PII payload dispatched between clearing banks via hardware-isolated secure enclave (TEE), satisfying global FATF Travel Rule regulations.",
    technicalDetails: [
      "IVMS-101 Regulatory Counterparty Payload Construction",
      "Asymmetric ECIES Public Key Hardware Encryption",
      "Real-Time UN / OFAC Sanctions & PEP Screening Gating",
      "Hardware-Isolated TEE Decryption & Compliance WORM Log Hash",
    ],
    badgeColor: "purple",
  },
  {
    stepNumber: 5,
    id: "atomic_fx_liquidity",
    title: "5. Bilateral Nostro/Vostro Atomic FX Liquidity Swap",
    shortTitle: "5. Atomic FX Swap",
    protocol: "Nexus Bilateral Liquidity Pool / 0-Slippage Lock",
    actor: "Correspondent FX Liquidity Engine",
    duration: "< 85ms",
    description: "Executes synchronized atomic swap between Origin Spoke Nostro account (debited in domestic currency) and Destination Spoke Vostro account (credited in foreign currency) with guaranteed 0-slippage exchange rate.",
    technicalDetails: [
      "Bilateral Liquidity Pool Dynamic Rebalancing",
      "Guaranteed Rate Lock & Basis-Point Settlement Matrix",
      "Origin Nostro Debit & Destination Vostro Credit",
      "Zero-Slippage Multi-Currency Settlement Finality",
    ],
    badgeColor: "teal",
  },
  {
    stepNumber: 6,
    id: "ledger_finality",
    title: "6. Immutable Double-Entry Ledger Finality & Push Settlement",
    shortTitle: "6. Ledger Finality",
    protocol: "ISO 20022 pacs.002.001.10 / ACCP Finality",
    actor: "Clearing Hub & Recipient Domestic IPS Rail",
    duration: "< 35ms",
    description: "Simultaneously commits dual balanced double-entry ledger updates, writes immutable WORM audit record, returns pacs.002 settlement confirmation, and triggers real-time WebSocket push notifications.",
    technicalDetails: [
      "Strict Scaled-Integer Double-Entry Balance Commit",
      "ISO 20022 pacs.002.001.10 ACCP (Accepted Settlement) Emit",
      "Unique Global UETR Tracking Key Anchoring",
      "Instant Real-Time WebSocket Push Notification Dispatch",
    ],
    badgeColor: "emerald",
  },
];

const TEST_CASE_STAGES = [
  { id: "ingest", label: "Payee Verification", desc: "Resolved proxy address and verified host KYC record.", tag: "API_GATEWAY" },
  { id: "quote", label: "Guaranteed FX Lock", desc: "Locked bilateral FX quote with 0-slippage guarantee.", tag: "LIQUIDITY_ENGINE" },
  { id: "zkp", label: "ZK Proof Generation", desc: "Generated Groth16 Zero-Knowledge circuit proof on BN254.", tag: "ZKP_CIRCUIT" },
  { id: "nullifier", label: "Nullifier Verification", desc: "Validated cryptographic nullifier against double-spending.", tag: "ANTI_DOUBLE_SPEND" },
  { id: "envelope", label: "FATF IVMS101 Envelope", desc: "Encrypted originator and beneficiary payload for regulatory transit.", tag: "TRAVEL_RULE" },
  { id: "iso20022", label: "ISO 20022 Construction", desc: "Formatted pacs.008.001.10 Financial Instant Credit Transfer message.", tag: "ISO_STANDARDS" },
  { id: "gateway", label: "Clearing Ingestion", desc: "Ingested into Correspondent Hub high-speed queue.", tag: "CENTRAL_HUB" },
  { id: "routing", label: "Cross-Spoke Routing", desc: "Routed packet between Spoke A and Spoke B message brokers.", tag: "STREAM_ROUTER" },
  { id: "merkle", label: "Merkle Root State Commit", desc: "Appended transaction hash to immutable Merkle tree root.", tag: "STATE_ENGINE" },
  { id: "groth16", label: "Circuit Verifier", desc: "Verified Zero-Knowledge constraint satisfaction in under 12ms.", tag: "ZK_VERIFIER" },
  { id: "anti_replay", label: "Anti-Replay Nonce", desc: "Ensured strictly increasing sequence nonce from origin account.", tag: "SECURITY_RAIL" },
  { id: "crypto_gate", label: "Cryptographic Gate", desc: "Passed multi-signature hardware security module validation.", tag: "HSM_GATE" },
  { id: "spoke_a", label: "Spoke A Domestic Debit", desc: "Debited Origin Nostro clearing account in local currency.", tag: "NOSTRO_DEBIT" },
  { id: "fx_swap", label: "Atomic FX Swap", desc: "Executed bilateral liquidity pool atomic settlement.", tag: "ATOMIC_SWAP" },
  { id: "spoke_b", label: "Spoke B Host Credit", desc: "Credited Destination Vostro clearing account in foreign currency.", tag: "VOSTRO_CREDIT" },
  { id: "travel_rule", label: "FATF Dispatch", desc: "Dispatched encrypted compliance envelope to recipient bank.", tag: "COMPLIANCE" },
  { id: "enclave_decryption", label: "Enclave Decryption", desc: "Decrypted beneficiary identification inside secure enclave (TEE).", tag: "SECURE_TEE" },
  { id: "sanctions_screening", label: "OFAC / AML Screening", desc: "Screened counterparties against global UN/OFAC PEP & sanctions lists.", tag: "AML_SANCTIONS" },
  { id: "ledger_commit", label: "Double-Entry Commit", desc: "Committed double-entry ledger debit & credit simultaneously.", tag: "LEDGER_COMMIT" },
  { id: "compliance_archival", label: "WORM Archival", desc: "Archived tamper-proof transaction record into WORM storage.", tag: "WORM_ARCHIVE" },
  { id: "push_notify", label: "Real-Time Push", desc: "Dispatched instant push notification to recipient device.", tag: "WEBSOCKET_PUSH" },
  { id: "sender_receipt", label: "Cryptographic Receipt", desc: "Generated UETR digital receipt pacs.002 settlement confirmation.", tag: "FINAL_RECEIPT" },
];

export const CorrespondentBankAdminDashboard: React.FC<CorrespondentBankAdminDashboardProps> = ({
  onLogout,
}) => {
  const { user, getAllUsers, getAllTransactions, toggleBlockUser } = useAuth();
  const { broadcastNotification } = useNotifications();

  const [activeAdminTab, setActiveAdminTab] = useState<
    "transactions" | "test_cases" | "journeys" | "users" | "corridors" | "broadcast"
  >("transactions");

  const [journeyRequests, setJourneyRequests] = useState<JourneyAdminItem[]>([]);
  const [userList, setUserList] = useState<AdminUserItem[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filter queries
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [txSearchQuery, setTxSearchQuery] = useState<string>("");
  const [txStatusFilter, setTxStatusFilter] = useState<"ALL" | "SETTLED" | "PROCESSING" | "FAILED">("ALL");

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<JourneyAdminItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Passport preview modal state
  const [previewPassportUrl, setPreviewPassportUrl] = useState<string | null>(null);

  // Broadcast announcement state
  const [broadcastTitle, setBroadcastTitle] = useState<string>("");
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // Test cases simulator state
  const [selectedTxForTest, setSelectedTxForTest] = useState<TransactionItem | null>(null);
  const [activeTestStageIndex, setActiveTestStageIndex] = useState<number>(22);
  const [isRunningTestSimulation, setIsRunningTestSimulation] = useState<boolean>(false);

  // 6 Major Transaction Steps State
  const [inspectingSixStepsTx, setInspectingSixStepsTx] = useState<TransactionItem | null>(null);
  const [activeSixStepSimIndex, setActiveSixStepSimIndex] = useState<number>(6);
  const [isRunningSixStepSim, setIsRunningSixStepSim] = useState<boolean>(false);
  const [testPipelineTabMode, setTestPipelineTabMode] = useState<"six_steps" | "granular_22">("six_steps");

  const [copiedUetr, setCopiedUetr] = useState<string | null>(null);

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

      // 3. Fetch Real Transactions
      const tData = await getAllTransactions();
      setAllTransactions(tData);
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
          description: "Funds allocated to user's RHI Pay travel wallet and push notification sent.",
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
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      toast.error("Please enter a mandatory rejection reason for the applicant.");
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
          description: "Applicant has been notified with mandatory reason.",
        });
        setRejectingItem(null);
        setRejectionReason("");
        fetchAdminData();
      } else {
        toast.error("Failed to reject request");
      }
    } catch (err: any) {
      toast.error(err.message || "Rejection error");
    }
  };

  const handleToggleBlock = async (targetUser: AdminUserItem) => {
    const res = await toggleBlockUser(targetUser.user_id);
    if (res.success) {
      toast.success(
        res.is_blocked
          ? `User ${targetUser.name} has been suspended from network.`
          : `User ${targetUser.name} has been restored.`
      );
      fetchAdminData();
    } else {
      toast.error(res.error || "Failed to update user status");
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast.error("Please enter broadcast title and message");
      return;
    }

    setIsBroadcasting(true);
    try {
      const success = await broadcastNotification(broadcastTitle, broadcastMessage, "ADMIN_ALERT", "ALL");
      if (success) {
        toast.success("Correspondent Bank Network Broadcast Dispatched!");
        setBroadcastTitle("");
        setBroadcastMessage("");
      } else {
        toast.error("Failed to dispatch broadcast");
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleRunTestSimulation = async (tx?: TransactionItem) => {
    if (isRunningTestSimulation) return;
    setIsRunningTestSimulation(true);
    if (tx) setSelectedTxForTest(tx);
    setActiveTestStageIndex(0);

    for (let i = 0; i <= TEST_CASE_STAGES.length; i++) {
      setActiveTestStageIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    setIsRunningTestSimulation(false);
    toast.success("Test Case Pipeline Verified: All 22 clearance checks PASSED with zero faults!");
  };

  const handleRunSixStepSimulation = async (tx?: TransactionItem) => {
    if (isRunningSixStepSim) return;
    setIsRunningSixStepSim(true);
    setActiveSixStepSimIndex(0);

    for (let i = 0; i <= SIX_MAJOR_TRANSACTION_STEPS.length; i++) {
      setActiveSixStepSimIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 380));
    }
    setIsRunningSixStepSim(false);
    toast.success("6 Major Transaction Steps Verified: Complete end-to-end settlement passed!");
  };

  const handleInspectTxInTestCases = (tx: TransactionItem) => {
    setSelectedTxForTest(tx);
    setActiveAdminTab("test_cases");
    setTestPipelineTabMode("granular_22");
    handleRunTestSimulation(tx);
  };

  const handleInspectTxSixSteps = (tx: TransactionItem) => {
    setInspectingSixStepsTx(tx);
    setActiveSixStepSimIndex(6);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUetr(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedUetr(null), 2000);
  };

  // Filtered Users
  const filteredUsers = userList.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.bank_name.toLowerCase().includes(q) ||
      u.account_number.toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  });

  // Filtered Transactions
  const filteredTransactions = allTransactions.filter((tx) => {
    if (txStatusFilter !== "ALL" && tx.status !== txStatusFilter) return false;
    if (!txSearchQuery.trim()) return true;
    const q = txSearchQuery.toLowerCase();
    return (
      tx.sender_name.toLowerCase().includes(q) ||
      tx.recipient_name.toLowerCase().includes(q) ||
      tx.transaction_id.toLowerCase().includes(q) ||
      tx.uetr.toLowerCase().includes(q) ||
      tx.sender_proxy.toLowerCase().includes(q) ||
      tx.recipient_proxy.toLowerCase().includes(q)
    );
  });

  const pendingJourneysCount = journeyRequests.filter((j) => j.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#040D14] text-zinc-100 p-3 sm:p-6 space-y-5 selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. STANDALONE ADMIN HEADER (No normal consumer controls) */}
      <header className="bg-gradient-to-r from-[#0b1c2b] via-[#081724] to-[#040e17] border border-amber-500/30 p-4 sm:p-5 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
            <Building2 className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                RHI Pay Correspondent Bank & Clearing Authority
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full font-mono shadow-sm">
                CENTRAL HUB CONTROL ROOM
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live settlement rails, bilateral Nostro/Vostro corridors, test cases & user registry
            </p>
          </div>
        </div>

        {/* Right Header: Admin info & Logout */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-white">{user?.name || "Correspondent Admin"}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{user?.email || "admin.rhipay@gmail.com"}</span>
          </div>

          <button
            type="button"
            onClick={fetchAdminData}
            className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-2xl text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN ADMIN NAVIGATION BAR */}
      <nav className="flex items-center gap-1.5 bg-zinc-950/80 p-1.5 rounded-2xl border border-white/[0.08] overflow-x-auto shadow-lg">
        {[
          { id: "transactions", label: "Ongoing & Past Transactions", icon: Receipt, count: allTransactions.length },
          { id: "test_cases", label: "Test Cases & Pipeline", icon: Cpu },
          { id: "journeys", label: "Travel Review", icon: Globe, count: pendingJourneysCount },
          { id: "users", label: "Registered Users", icon: UserCheck, count: userList.length },
          { id: "corridors", label: "Nostro / Corridors", icon: Landmark },
          { id: "broadcast", label: "Broadcast Announcement", icon: BellRing },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black scale-[1.02]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${isActive ? "bg-black text-amber-400" : "bg-amber-500/20 text-amber-300"
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. TAB 1: ONGOING & PAST TRANSACTIONS (Real SQLite Database Ledger) */}
      {activeAdminTab === "transactions" && (
        <div className="space-y-4 animate-in fade-in">
          {/* 6 MAJOR STEPS TRANSACTION CLEARANCE ARCHITECTURE BANNER */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#061e2b] via-[#041520] to-[#020d14] border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    6 Major Steps Happening Between Transactions
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500 text-black">
                    CORE RAIL LIFECYCLE
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Every cross-border settlement strictly traverses these 6 immutable cryptographic and double-entry clearance pillars in under 2.5 seconds.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRunningSixStepSim}
                  onClick={() => handleRunSixStepSimulation()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningSixStepSim ? "animate-spin" : ""}`} />
                  <span>{isRunningSixStepSim ? "Simulating Clearance Rail..." : "Simulate 6-Step Clearance"}</span>
                </button>
              </div>
            </div>

            {/* 6 Steps Horizontal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
              {SIX_MAJOR_TRANSACTION_STEPS.map((step, sIdx) => {
                const isPassed = sIdx < activeSixStepSimIndex;
                const isCurrent = sIdx === activeSixStepSimIndex;

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                      isPassed
                        ? "bg-[#062018]/70 border-emerald-500/40 shadow-sm"
                        : isCurrent
                        ? "bg-amber-950/60 border-amber-400 shadow-md ring-1 ring-amber-400/50 scale-[1.02]"
                        : "bg-zinc-950/40 border-white/[0.04] opacity-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-black text-amber-400">
                          STEP 0{step.stepNumber}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {step.duration}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                        {step.shortTitle}
                      </h4>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span className="truncate max-w-[90px]">{step.actor.split(" ")[0]}</span>
                      {isPassed ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> PASSED
                        </span>
                      ) : isCurrent ? (
                        <span className="text-amber-400 font-bold animate-pulse">PROCESSING</span>
                      ) : (
                        <span className="text-zinc-600">PENDING</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subheader & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950/60 border border-white/[0.06] p-4 rounded-3xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                placeholder="Search real transactions by Sender, Recipient, Transaction ID, UETR, Proxy..."
                className="w-full py-2.5 pl-10 pr-4 rounded-2xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["ALL", "SETTLED", "PROCESSING", "FAILED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTxStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase font-mono transition-all cursor-pointer ${
                    txStatusFilter === st
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-20 text-center bg-zinc-950/40 border border-white/[0.06] rounded-3xl">
                <p className="text-sm font-semibold text-zinc-400">No transactions recorded matching search criteria</p>
                <p className="text-xs text-zinc-500 mt-1">All transfers initiated by users appear here in real-time.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.transaction_id}
                  className="p-4 sm:p-5 rounded-3xl bg-zinc-950/80 border border-white/[0.08] hover:border-amber-500/30 transition-all shadow-md space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Top Identifiers */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-300 text-sm">{tx.transaction_id}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            tx.status === "SETTLED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : tx.status === "PROCESSING"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {tx.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                          {tx.category}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ISO: <strong className="text-emerald-400">{tx.iso_status}</strong>
                        </span>
                      </div>

                      {/* Counterparty details */}
                      <div className="flex items-center gap-3 text-xs text-zinc-300 flex-wrap pt-1">
                        <span>
                          Sender: <strong className="text-white">{tx.sender_name}</strong> ({tx.sender_account_number || tx.sender_proxy})
                        </span>
                        <span className="text-zinc-500">➔</span>
                        <span>
                          Recipient: <strong className="text-white">{tx.recipient_name}</strong> ({tx.recipient_account_number || tx.recipient_proxy})
                        </span>
                      </div>

                      {/* UETR & timestamp */}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono pt-0.5">
                        <span>UETR: {tx.uetr}</span>
                        <button onClick={() => handleCopy(tx.uetr)} className="text-zinc-500 hover:text-white cursor-pointer">
                          {copiedUetr === tx.uetr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <span>•</span>
                        <span>FX: 1 {tx.recipient_currency} = {tx.exchange_rate} {tx.sender_currency}</span>
                        <span>•</span>
                        <span>{new Date(tx.created_at).toLocaleString()}</span>
                      </div>

                      {/* 6 MAJOR SETTLEMENT STEPS MINI PROGRESS BAR */}
                      <div className="pt-2">
                        <div className="flex items-center gap-1 overflow-x-auto py-1">
                          {SIX_MAJOR_TRANSACTION_STEPS.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[9px] font-mono font-bold text-emerald-300 whitespace-nowrap"
                              title={`${s.title}: ${s.description}`}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>{s.shortTitle}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Amounts & 6 Steps Trigger */}
                    <div className="flex items-center md:flex-col md:items-end justify-between gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                      <div>
                        <p className="text-base sm:text-lg font-black font-mono text-emerald-300 md:text-right">
                          +{tx.recipient_currency} {Number(tx.recipient_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono md:text-right">
                          Debited: -{tx.sender_currency} {Number(tx.sender_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectTxSixSteps(tx)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Inspect 6 Steps</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectTxInTestCases(tx)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Cpu className="w-3.5 h-3.5 text-amber-400" />
                          <span>22 Tests</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: TRANSACTION TEST CASES & ISO 20022 VERIFICATION PIPELINE */}
      {activeAdminTab === "test_cases" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Test Case Simulator Banner with Toggle */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#081d2e] to-[#04101a] border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Correspondent Clearing Test Cases & Proof Pipeline</h3>
              </div>
              <p className="text-xs text-zinc-400">
                {selectedTxForTest
                  ? `Currently inspecting live audit trail for ${selectedTxForTest.transaction_id}`
                  : "Interactive verification suite validating clearance rails, ZK proofs, and double-entry accounting"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setTestPipelineTabMode("six_steps")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    testPipelineTabMode === "six_steps"
                      ? "bg-amber-500 text-black shadow font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  6 Major Steps
                </button>
                <button
                  type="button"
                  onClick={() => setTestPipelineTabMode("granular_22")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    testPipelineTabMode === "granular_22"
                      ? "bg-cyan-500 text-black shadow font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  22 Unit Stages
                </button>
              </div>

              {testPipelineTabMode === "six_steps" ? (
                <button
                  type="button"
                  disabled={isRunningSixStepSim}
                  onClick={() => handleRunSixStepSimulation(selectedTxForTest || undefined)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 ${isRunningSixStepSim ? "animate-spin" : ""}`} />
                  <span>{isRunningSixStepSim ? "Executing 6 Core Settlement Steps..." : "Run 6-Step Simulation"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isRunningTestSimulation}
                  onClick={() => handleRunTestSimulation(selectedTxForTest || undefined)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 ${isRunningTestSimulation ? "animate-spin" : ""}`} />
                  <span>{isRunningTestSimulation ? "Executing 22 Verification Stages..." : "Run 22-Stage Simulation"}</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: 6 MAJOR SETTLEMENT STEPS */}
          {testPipelineTabMode === "six_steps" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {SIX_MAJOR_TRANSACTION_STEPS.map((step, idx) => {
                const isPassed = idx < activeSixStepSimIndex;
                const isCurrent = idx === activeSixStepSimIndex;

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                      isPassed
                        ? "bg-[#062018]/70 border-emerald-500/40 shadow-sm"
                        : isCurrent
                        ? "bg-amber-950/60 border-amber-400 shadow-md ring-1 ring-amber-400/50 scale-[1.01]"
                        : "bg-zinc-950/40 border-white/[0.04] opacity-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-black text-amber-400">
                          STEP 0{step.stepNumber}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {step.duration}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">{step.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                      <div className="text-[10px] text-zinc-400 font-mono space-y-0.5">
                        <div>Protocol: <strong className="text-zinc-200">{step.protocol}</strong></div>
                        <div>Actor: <strong className="text-zinc-200">{step.actor}</strong></div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-500 block">
                          Validation Checks
                        </span>
                        {step.technicalDetails.map((td, tIdx) => (
                          <div key={tIdx} className="flex items-start gap-1.5 text-[10px] text-zinc-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{td}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">Status</span>
                        {isPassed ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED & CLEAR
                          </span>
                        ) : isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono border border-amber-500/40 animate-pulse">
                            ACTIVE VERIFICATION...
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[10px] font-mono">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: 22 GRANULAR TEST STAGES GRID */}
          {testPipelineTabMode === "granular_22" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEST_CASE_STAGES.map((stage, idx) => {
                const isPassed = idx < activeTestStageIndex;
                const isCurrent = idx === activeTestStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isPassed
                        ? "bg-[#061e18]/60 border-emerald-500/30 shadow-sm"
                        : isCurrent
                        ? "bg-cyan-950/60 border-cyan-400 shadow-md ring-1 ring-cyan-400/50"
                        : "bg-zinc-950/40 border-white/[0.04] opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">
                        Stage {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[9px] font-bold font-mono ${
                          isPassed
                            ? "bg-emerald-500/20 text-emerald-300"
                            : isCurrent
                            ? "bg-cyan-500/20 text-cyan-300 animate-pulse"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {stage.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      {isPassed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 flex-shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-white">{stage.label}</h4>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed pl-6">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: TRAVEL REVIEW & PASSPORT VERIFICATION */}
      {activeAdminTab === "journeys" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Travel Currency & Passport Verification Queue ({journeyRequests.length})
            </h3>
            <button onClick={fetchAdminData} className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
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
              const isCancelled = req.status === "CANCELLED";

              return (
                <div
                  key={req.request_id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${isPending
                      ? "bg-[#091b26] border-amber-500/40 shadow-lg shadow-amber-950/20"
                      : isCancelled
                        ? "bg-[#160b13]/50 border-purple-500/30"
                        : "bg-zinc-950/60 border-white/[0.06]"
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{req.user_name}</span>
                        <span className="text-xs text-zinc-400 font-mono">({req.user_email})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${isPending
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : isApproved
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : isCancelled
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
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
                            {req.destination_currency} {Number(req.destination_amount_calculated).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>{" "}
                          <span className="text-zinc-400 text-[10px]">
                            ({req.home_currency} {Number(req.home_amount_requested).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                          </span>
                        </div>

                        {/* Passport document viewer */}
                        <div className="pl-4 border-l border-white/10">
                          <span className="text-[10px] text-zinc-400 block">Passport Document</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPassportUrl(req.passport_data_url || "data:image/png;base64,demo")
                            }
                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>View {req.passport_filename || "Passport Scan"}</span>
                          </button>
                        </div>
                      </div>

                      {req.rejection_reason && (
                        <p className="text-xs text-zinc-400 italic pt-1">
                          Reason / Audit: {req.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Action Controls for Pending Requests */}
                    {isPending && (
                      <div className="flex items-center gap-2 pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => setRejectingItem(req)}
                          className="px-3.5 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveJourney(req.request_id)}
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
                        >
                          Approve Exchange
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

      {/* 6. TAB 4: REGISTERED USERS & BANK DETAILS (STRICTLY NO UPI PIN) */}
      {activeAdminTab === "users" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search registered users by name, email, bank, or account number..."
                className="w-full py-2.5 pl-10 pr-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button onClick={fetchAdminData} className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Directory</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredUsers.map((u) => (
              <div
                key={u.user_id}
                className="p-4 rounded-2xl bg-zinc-950/70 border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{u.name}</span>
                    <span className="text-zinc-400 font-mono">({u.email})</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
                      {u.kyc_status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                      {u.role}
                    </span>
                    {u.is_blocked && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold font-mono">
                        BLOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-zinc-300 flex-wrap">
                    <span>Country: <strong>{COUNTRY_FLAGS[u.home_country] || ""} {u.home_country}</strong></span>
                    <span>•</span>
                    <span>Bank: <strong>{u.bank_name}</strong></span>
                    <span>•</span>
                    <span>Account No: <strong className="font-mono text-cyan-300">{u.account_number}</strong></span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono pt-0.5 flex-wrap">
                    <span className="text-zinc-400">
                      Home Balance: <strong className="text-emerald-300">{Number(u.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </span>
                    {u.active_journey_country && (
                      <span className="text-cyan-300 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                        ✈️ Travel Balance ({u.active_journey_country}): {Number(u.travel_wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Status Toggle (Strictly No UPI PIN Displayed) */}
                <div className="flex items-center gap-2 pt-2 md:pt-0">
                  <button
                    type="button"
                    onClick={() => handleToggleBlock(u)}
                    className={`px-3.5 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer ${u.is_blocked
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30"
                      }`}
                  >
                    {u.is_blocked ? "Unblock Account" : "Block User"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB 5: CORRESPONDENT NOSTRO/VOSTRO LIQUIDITY CORRIDORS */}
      {activeAdminTab === "corridors" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NOSTRO_VOSTRO_CORRIDORS.map((c) => (
              <div
                key={c.bic}
                className="p-4 sm:p-5 rounded-3xl bg-zinc-950/70 border border-white/[0.08] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{c.spoke}</span>
                    <span className="text-[10px] font-mono text-zinc-400">BIC: {c.bic} • Latency: {c.latency}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Nostro (Domestic Pool)</span>
                    <span className="text-emerald-300 font-bold text-sm">{c.currency} {c.nostroBalance}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Vostro (Host Reserve)</span>
                    <span className="text-cyan-300 font-bold text-sm">{c.currency} {c.vostroBalance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB 6: BROADCAST NETWORK ANNOUNCEMENT */}
      {activeAdminTab === "broadcast" && (
        <div className="space-y-4 animate-in fade-in max-w-2xl mx-auto">
          <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/80 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-base font-bold text-white">Broadcast Announcement to All App Users</h4>
                <p className="text-xs text-zinc-400">Dispatches real-time high priority push notifications</p>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled Network Upgrade / FX Corridor Optimization"
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-zinc-900 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Detailed announcement notification message..."
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-zinc-900 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isBroadcasting ? "Dispatching Broadcast Across Network..." : "Send Network Broadcast Push"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#08131d] border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <button
              onClick={() => setRejectingItem(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white">Reject Journey Request</h3>
            <p className="text-xs text-zinc-300">
              Provide a mandatory explanation for rejecting {rejectingItem.user_name}&apos;s travel exchange request.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Passport expiration within 6 months, invalid visa document..."
              className="w-full p-3 rounded-2xl bg-zinc-950 border border-white/[0.12] text-xs text-white focus:outline-none focus:border-rose-400 resize-none"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/30 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport Preview Modal */}
      {previewPassportUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#08131d] border border-white/[0.1] rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <button
              onClick={() => setPreviewPassportUrl(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Passport Document Inspection</span>
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/[0.08] max-h-96 overflow-y-auto flex items-center justify-center">
              {previewPassportUrl.startsWith("data:image") ? (
                <img src={previewPassportUrl} alt="Passport Scan" className="max-w-full rounded-lg" />
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <FileCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <span>Document encrypted & certified by issuer authority.</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewPassportUrl(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* 6 Major Steps Transaction Clearance Inspector Modal */}
      {inspectingSixStepsTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#061824] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-950/40 text-white max-h-[92vh] overflow-y-auto space-y-4">
            {/* Close Button */}
            <button
              onClick={() => setInspectingSixStepsTx(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    6 Major Steps Clearance Inspector
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    SETTLED VIA BIS NEXUS
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Tx ID: <span className="text-amber-300 font-bold">{inspectingSixStepsTx.transaction_id}</span> | UETR: {inspectingSixStepsTx.uetr}
                </p>
              </div>
            </div>

            {/* Counterparty & Settlement Summary Card */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block">Sender Origin</span>
                <p className="text-sm font-bold text-white">{inspectingSixStepsTx.sender_name}</p>
                <p className="text-xs font-mono text-zinc-400">{inspectingSixStepsTx.sender_account_number || inspectingSixStepsTx.sender_proxy}</p>
                <p className="text-xs font-mono text-rose-300 font-bold mt-1">
                  Debited: -{inspectingSixStepsTx.sender_currency} {Number(inspectingSixStepsTx.sender_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block">Recipient Destination</span>
                <p className="text-sm font-bold text-white">{inspectingSixStepsTx.recipient_name}</p>
                <p className="text-xs font-mono text-zinc-400">{inspectingSixStepsTx.recipient_account_number || inspectingSixStepsTx.recipient_proxy}</p>
                <p className="text-xs font-mono text-emerald-300 font-bold mt-1">
                  Credited: +{inspectingSixStepsTx.recipient_currency} {Number(inspectingSixStepsTx.recipient_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="md:border-l md:border-white/10 md:pl-4 space-y-1 text-xs font-mono">
                <div className="text-zinc-400">
                  Rate: <span className="text-emerald-400 font-bold">1 {inspectingSixStepsTx.recipient_currency} = {inspectingSixStepsTx.exchange_rate} {inspectingSixStepsTx.sender_currency}</span>
                </div>
                <div className="text-zinc-400">
                  Status: <span className="text-emerald-300 font-bold">{inspectingSixStepsTx.iso_status}</span>
                </div>
                <div className="text-zinc-400">
                  Time: <span>{new Date(inspectingSixStepsTx.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* 6 Steps Sequential Clearance Breakdown */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Detailed 6-Step Clearance Execution Pipeline
                </span>
                <button
                  type="button"
                  onClick={() => handleRunSixStepSimulation(inspectingSixStepsTx)}
                  disabled={isRunningSixStepSim}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 ${isRunningSixStepSim ? "animate-spin" : ""}`} />
                  <span>{isRunningSixStepSim ? "Re-simulating Steps..." : "Simulate 6 Steps"}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {SIX_MAJOR_TRANSACTION_STEPS.map((step, idx) => {
                  const isPassed = idx < activeSixStepSimIndex;
                  const isCurrent = idx === activeSixStepSimIndex;

                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isPassed
                          ? "bg-[#062018]/70 border-emerald-500/40 shadow-sm"
                          : isCurrent
                          ? "bg-amber-950/60 border-amber-400 shadow-md ring-1 ring-amber-400/50"
                          : "bg-zinc-950/40 border-white/[0.04] opacity-50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-black font-mono text-[11px] flex items-center justify-center flex-shrink-0">
                            {step.stepNumber}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white">{step.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {step.duration}
                          </span>
                          {isPassed ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASSED
                            </span>
                          ) : isCurrent ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                              RUNNING...
                            </span>
                          ) : (
                            <span className="text-zinc-500">PENDING</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed pl-8">{step.description}</p>

                      <div className="mt-2.5 pl-8 pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                        <div>Protocol: <span className="text-zinc-200 font-semibold">{step.protocol}</span></div>
                        <div>Actor: <span className="text-zinc-200 font-semibold">{step.actor}</span></div>
                      </div>

                      <div className="mt-2 pl-8 space-y-1">
                        {step.technicalDetails.map((td, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span>{td}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setInspectingSixStepsTx(null)}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Close 6-Step Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


# RHIPay (P2P) — Agent Operating Guide

## System Overview

RHIPay is a cross-border, peer-to-peer (P2P) instant payment system operating on the **BIS Nexus Hub-and-Spoke model** with **Zero-Knowledge Proof (ZKP)** privacy preservation and **ISO 20022** messaging standards.

### Core Roles
- **Sender (Payer)**: Initiates payments, generates client-side ZK Merkle proofs (<1.2s), and encrypts PII using ECIES/RSA envelopes for FATF Travel Rule compliance.
- **Receiver (Payee)**: Generates and presents dynamic/static QR codes, receives real-time ISO 20022 settlement notifications.
- **Admin & Compliance**: Oversees double-entry ledgers, live FX pool balances, raw ISO 20022 XML (`pacs.008`) inspections, and real-time ZKP verification telemetry.

---

## Technology Stack & Tooling Requirements

### 1. Backend (`/backend` or `/hub`)
- **Runtime & Package Manager**: **Python 3.11+ managed strictly via `uv`**.
  - Always run scripts and servers with `uv run <command>` (e.g., `uv run fastapi dev`, `uv run pytest`).
  - Manage dependencies with `uv add <pkg>` and virtual environments with `uv venv`.
- **Framework**: FastAPI with async route handlers and WebSocket telemetry.
- **Standards & Formats**: ISO 20022 `pacs.008.001.xx` (JSON & XML parsers/serializers).
- **Cryptography**: Poseidon Merkle tree validator, SnarkJS verifier, Anti-replay nullifier registry, ECIES/RSA envelope decryption.
- **Ledger & DB**: Double-entry ledger with integer/scaled decimal accounting (SQLite / PostgreSQL with SQLModel/SQLAlchemy async).

### 2. Frontend (`/frontend` or `/web`)
- **Framework**: **Next.js (App Router) + TypeScript**.
- **Package Manager**: `npm` / `pnpm`.
- **Components & Styling**: Modern responsive UI with anti-AI-slop craft standards, crisp contrast, dark mode, and fluid micro-interactions.
- **Toasts & Feedback**: `sonner` via `ask-sonner`.
- **Client ZKP & Crypto**: WebAssembly SnarkJS proof generator, Poseidon hashing, QR generation & scanning (e.g., `@zxing` or `html5-qrcode`).

---

## Installed Skills & Routing Guide

Agents working on this codebase must route specialized tasks to the installed skills in [`.agents/skills`](file:///.agents/skills):

### 1. Architecture, Modeling & Deep Modules
- **Domain Modeling & Ledger Entities**: Follow [`.agents/skills/domain-modeling`](file:///.agents/skills/domain-modeling) when structuring accounts, FXP bilateral pools, transactions, and cryptographic commitments.
- **Deep Module Boundaries & Seams**: Consult [`.agents/skills/codebase-design`](file:///.agents/skills/codebase-design) before implementing or refactoring core subsystems (settlement engine, verification hub, parsers).
- **System Architecture Review**: Use [`.agents/skills/improve-codebase-architecture`](file:///.agents/skills/improve-codebase-architecture) when analyzing systemic performance, scalability, or clean separation.

### 2. Implementation, TDD & Verification
- **Test-Driven Development**: Apply [`.agents/skills/tdd`](file:///.agents/skills/tdd) for all settlement logic, cryptographic validations, double-entry ledgers, and ISO 20022 parsers.
- **Specification to Code**: Execute features using [`.agents/skills/implement`](file:///.agents/skills/implement).
- **Bug Diagnosis & Async Race Conditions**: Troubleshoot circuit generation, double-spend nullifier races, or ledger imbalances with [`.agents/skills/diagnosing-bugs`](file:///.agents/skills/diagnosing-bugs).
- **Code Review**: Audit PRs and feature diffs using [`.agents/skills/code-review`](file:///.agents/skills/code-review).
- **Headless Browser & E2E Testing**: Automate QR scan, payment execution, and admin telemetry tests using [`.agents/skills/playwright-cli`](file:///.agents/skills/playwright-cli).

### 3. Frontend Craft, Visuals & Interaction
- **UI Design & Layouts**: Follow [`.agents/skills/hallmark`](file:///.agents/skills/hallmark) for typography, color balance, density, and intentional component design.
- **Component Polish & Feel**: Reference [`.agents/skills/emil-design-eng`](file:///.agents/skills/emil-design-eng) and [`.agents/skills/apple-design`](file:///.agents/skills/apple-design) for interaction physics, gestures, tracking, and optical alignment.
- **Toast Notifications**: Wire up toast notifications via [`.agents/skills/ask-sonner`](file:///.agents/skills/ask-sonner).

### 4. Motion & Micro-Interactions
- **Motion Implementation**: Build QR viewfinder animations, payment completion flourishes, and balance counters using [`.agents/skills/animate`](file:///.agents/skills/animate).
- **Motion Auditing & Vocabulary**: Use [`.agents/skills/animation-vocabulary`](file:///.agents/skills/animation-vocabulary) and [`.agents/skills/find-animation-opportunities`](file:///.agents/skills/find-animation-opportunities) to identify and refine interface choreography.

---

## Core Engineering Rules

1. **Deterministic Double-Entry Ledger**:
   - Every balance modification must consist of balanced debit and credit ledger entries.
   - Never use IEEE floating-point numbers for money calculations; use integer units (cents/basis points) or `Decimal`.

2. **Zero-Knowledge & Cryptographic Safety**:
   - Poseidon hash field elements must remain strictly identical between client witness generators and backend/circuit verifiers.
   - Maintain persistent anti-replay nullifier tracking to prevent double spending.

3. **ISO 20022 Compliance**:
   - Every transaction payload must adhere to the `pacs.008` format with ZKP commitments and encrypted PII envelopes encapsulated inside supplementary data blocks.

4. **Python UV Discipline**:
   - All backend execution, testing, and dependency management must be performed through `uv`.

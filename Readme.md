🛡️ FraudTrace — Digital Evidence Locker & Forensic Incident DossierHackathon Track: Problem Statement 3 — Organizing Evidence After an Online Fraud Incident   Status: Production-Ready Forensic Pipeline & Dispute Automation   Core Engine: Multimodal Google Gemini (gemini-3.8-flash) + Dual-Engine Heuristic Fallback   📌 Executive SummaryFollowing an online financial fraud incident, victims and frontline support workers face a chaotic landscape: critical evidence is scattered across disparate WhatsApp/Telegram chats, bank SMS alerts, UPI payment screenshots, call logs, and rogue URLs. Crucial details are missing, timestamps are out of order, and sensitive personally identifiable information (PII) is routinely exposed in an unorganized panic.   FraudTrace solves this problem by providing an automated digital forensics intelligence pipeline. It ingests fragmented multi-source evidence, computes cryptographic SHA-256 integrity hashes, extracts key investigative indicators, constructs a normalized chronological timeline, masks complainant PII, and outputs statutory dockets for the National Cyber Crime Reporting Portal (Helpline 1930 / cybercrime.gov.in) and Bank Chargeback / Recall Requisitions under RBI customer protection guidelines.   🔄 End-to-End Architectural WorkflowFraudTrace implements the exact 7-Phase Digital Forensics Framework defined in the process flowchart:   Plaintext┌────────────────────────────────────────────────────────────────────────┐
│                        RAW EVIDENCE INTAKE                             │
│     (Chat Exports, UPI Receipts, Bank SMS, URLs, Victim Narrative)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 1 & 2: INGESTION & FORENSIC EXTRACTION                          │
│  • Calculate SHA-256 cryptographic hashes for chain of custody         │
│  • Multimodal Gemini / Heuristic extraction of UTRs, VPAs, URLs, Phone │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 3: CHRONOLOGICAL RECONSTRUCTION                                 │
│  • Split narrative and evidence into discrete milestones               │
│  • Map actor roles (Victim, Reported Perpetrator, Bank Gateway)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 4: MISSING INFORMATION AUDIT                                    │
│  • Detect evidentiary omissions (missing UTRs, unattached statements)  │
│  • Calculate Dossier Readiness Score (0-100%)                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 5: CONTRADICTION & ANOMALY DETECTION                            │
│  • Temporal sequence validation (contact precedes debit)               │
│  • Financial reconciliation (claimed loss vs sum of verified receipts) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 6: PRIVACY REDACTION PROTOCOL                                   │
│  • Regex masking of 12+ digit accounts: [REDACTED-BANK-A/C]            │
│  • Complainant phone masking: [REDACTED-USER-PHONE]                    │
│  • Suspect indicators (VPAs, URLs, scammer phones) left unredacted     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 7: STATUTORY DOSSIER GENERATION & EXPORT                        │
│  • RBI Bank Dispute & Recall Requisition Letter                        │
│  • Formatted Cybercrime 1930 Complaint Text                            │
│  • Redacted RFC 4180 CSV & Court-Ready Print PDF                       │
└────────────────────────────────────────────────────────────────────────┘
🎯 Problem Statement AlignmentProblem Statement 3 Requirement   JPGFraudTrace Architectural Solution   ZIPFile Reference   ZIPCombine & Organize Scattered Evidence   Ingestion pipeline for images, PDFs, raw text narratives, and chat exports with unified preview modals.   src/components/EvidenceUploadView.tsx, EvidenceModal.tsx   Extract Dates, Amounts, Refs, URLs   Multimodal AI extractor pulls UTRs, VPAs, mobile numbers, phishing URLs, dates, and currency values.   server.ts (/api/analyze-evidence), src/utils/forensicExtractor.ts   Chronological Incident Timeline   Sequential timeline reconstruction ordering events from initial contact to victim realization and bank reporting.   src/components/TimelineView.tsx, server.ts (/api/parse-narrative)   Privacy-Conscious Reporting   Automatic regex masking of 12+ digit bank accounts, card numbers, and complainant phone numbers.   src/utils/redactionAndCsv.ts   Identify Gaps & Inconsistencies   Extraction confidence scoring, per-event risk telemetry, and source-file traceability citations for every data point.   src/components/EvidenceDashboardView.tsx, NewReportView.tsx   Investigative Neutrality   Formats objective records for police/bank dispute desks without declaring legal guilt or replacing statutory channels.   src/components/ReportView.tsx, PrintablePdfModal.tsx   🚀 Key Features1. Dual-Agent Narrative & Evidence EngineNarrative Parsing Agent (/api/parse-narrative): Ingests free-text victim statements and splits them into discrete chronological milestones (e.g., Initial Phishing Contact, Coerced UPI Transfer, Extortion Fee Demand).   Timeline & Risk Agent (/api/analyze-timeline-risk): Enriches each event with threat tags (PHISHING_URL, COERCED_UPI_TRANSFER), step risk scores (0–100), severity classifications, and bank clarification justifications.   2. Forensic Cryptographic Chain of CustodyComputes client-side SHA-256 hashes via the native browser Web Crypto API (crypto.subtle.digest) upon ingestion.   Ensures evidence integrity and legal admissibility without server alteration.   3. Bidirectional Evidentiary TraceabilityEvery extracted transaction ID, UTR, UPI handle, and contact number in the Evidence Dashboard retains an anchor linking directly back to its source screenshot or document.   4. Automated PII Redaction StationAutomatically sanitizes sensitive complainant data before export:   Account/Card numbers (12–24 digits) $\to$ [REDACTED-BANK-A/C]   Complainant phone numbers $\to$ [REDACTED-USER-PHONE]   Identity documents $\to$ [Aadhaar Redacted]Retains unredacted perpetrator footprints (suspect VPAs, scammer numbers, phishing links) to facilitate immediate inter-bank account freezes and police tracking.   5. Statutory Export DocketsBank Dispute & Recall Letter: Pre-drafted formal letter citing the RBI Master Circular on Customer Protection in Unauthorised Electronic Banking Transactions.   1930 / Cybercrime Portal Draft: Formatted text structured for direct submission to cybercrime.gov.in.   RFC 4180 Bank CSV: Sanitized, tabular incident telemetry export.   Printable Court-Ready PDF: Dedicated print stylesheet (@media print) rendering high-contrast dispute dossiers.   6. Predictive Threat & Financial AnalyticsCustom zero-dependency responsive SVG data visualizers:   Fraud Probability & Severity Meter: Semi-circle speedometer gauge mapping risk level.   Cumulative Loss Trajectory: Area chart showing step-by-step financial drain.   Threat Vector Breakdown: Donut chart analyzing attack tactics.   Per-Step Risk Progression: Step-by-step threat severity index.   🛠️ Tech StackFrontendFramework: React 19 (19.0.1)   Language: TypeScript (7.0.2 / ES2022)   Build Tool: Vite (8.3.0) with @vitejs/plugin-react   Styling: Tailwind CSS (4.3.3) via @tailwindcss/vite   Icons: Lucide React (0.546.0)   Motion: Motion (12.23.24)   Cryptography: Native Browser Web Crypto API (SHA-256)   Backend & AIRuntime: Node.js + Express (4.21.2) executed via TSX (4.21.0)   AI SDK: @google/genai (2.4.0)   Model: gemini-3.8-flash (with deterministic JSON schemas)   Heuristic Fallback: Local client-side regex parsing engines for offline resilience   📂 Project StructurePlaintext├── server.ts                       # Express server + Gemini multimodal endpoints
├── package.json                    # Project dependencies & scripts
├── vite.config.ts                  # Vite + Tailwind v4 plugin config
├── index.html                      # App root HTML & font preconnects
├── src/
│   ├── main.tsx                    # React application entry point
│   ├── App.tsx                     # State orchestrator & tab routing
│   ├── index.css                   # Tailwind v4 styling + @media print rules
│   ├── types/
│   │   └── index.ts                # TypeScript domain models & API schemas
│   ├── utils/
│   │   ├── crypto.ts               # Web Crypto SHA-256 hashing & formatting
│   │   ├── forensicExtractor.ts   # Dual-mode entity extraction & OCR fallback[cite: 5]
│   │   ├── narrativeAgent.ts       # Narrative parsing & timeline risk agent[cite: 5]
│   │   └── redactionAndCsv.ts      # Privacy regex masking & RFC 4180 CSV engine[cite: 5]
│   ├── data/
│   │   └── sampleIncident.ts       # Pre-loaded mock case with SVG artifacts[cite: 5]
│   └── components/
│       ├── Navbar.tsx              # Tactical case header & quick sample reset[cite: 5]
│       ├── NewReportView.tsx       # Single-box narrative intake & instant report[cite: 5]
│       ├── HomeView.tsx            # Executive metrics & suspect footprint[cite: 5]
│       ├── CreateIncidentView.tsx  # Manual incident registration & case templates[cite: 5]
│       ├── EvidenceUploadView.tsx  # Drag-and-drop evidence locker & demo loader[cite: 5]
│       ├── EvidenceDashboardView.tsx# Entity explorer & source-file citations[cite: 5]
│       ├── EvidenceModal.tsx       # Forensic preview modal with hash inspector[cite: 5]
│       ├── TimelineView.tsx        # Chronological interactive milestone tree[cite: 5]
│       ├── ReportView.tsx          # Incident dossier & bank dispute generator[cite: 5]
│       ├── FraudAnalyticsCharts.tsx# SVG speedometer, area chart & vector donut[cite: 5]
│       └── PrintablePdfModal.tsx   # Formal print/PDF document viewer[cite: 5]
⚡ Getting StartedPrerequisitesNode.js (v18.0.0 or higher)npm or yarnInstallationClone the repository:Bashgit clone https://github.com/your-username/fraudtrace.git
cd fraudtrace
Install dependencies:Bashnpm install
Configure environment variables:
Copy .env.example to .env.local and add your Google Gemini API key[cite: 5]:Code snippetGEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
(Note: FraudTrace includes an offline regex fallback engine[cite: 5]. If no API key is provided, pattern-based extraction will execute automatically[cite: 5]).Run the development server:Bashnpm run dev
Open your browser at http://localhost:3000[cite: 5].🧪 Testing the Pipeline (Quick Hackathon Evaluation)Navigate to New Report (or click the Fast button on the navbar)[cite: 5].Choose one of the pre-loaded sample incidents (e.g., Telegram Investment & Dual UPI Scam)[cite: 5].Click Generate Report & Timeline[cite: 5].Observe the two-step AI pipeline split the story, compute per-step risk scores, mask complainant account numbers, and generate a bank-ready CSV and dispute letters in real time[cite: 5].Click Download / Print PDF Report to view the printable dispute docket[cite: 5].⚖️ Investigative Neutrality & Legal DisclaimerFraudTrace is an evidence organization and incident documentation tool designed to assist victims and support personnel in compiling structured records for submission to authorized bodies. FraudTrace does not make legal determinations of guilt, adjudicate criminal culpability, or replace statutory law enforcement channels or official banking dispute procedures.

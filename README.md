# FraudTrace

**FraudTrace** is a web-based digital fraud investigation and evidence-organization platform. It helps users turn an online-fraud incident into a structured case file containing preserved evidence, extracted entities, a chronological timeline, risk analysis, and complaint/dispute-ready reports.

> **Important:** FraudTrace is an evidence-organization and reporting aid. It does not establish legal guilt, replace professional investigation, or guarantee recovery of funds.

## Features

- **Incident management**
  - Create and maintain a structured fraud incident.
  - Track fraud category, status, loss, recovery, victim details, suspect details, and platform used.
  - Persist the active case in browser `localStorage`.

- **Digital evidence locker**
  - Upload and organize screenshots, chat exports, bank SMS, phishing pages, call logs, email headers, suspect profiles, bank statements, and other artifacts.
  - Calculate a **SHA-256 hash** for uploaded evidence to help demonstrate file-integrity consistency.
  - Attach notes and extracted information to each artifact.

- **Automated entity extraction**
  - Detect likely:
    - UPI IDs / VPAs
    - Transaction IDs / UTRs
    - Amounts and currencies
    - Phone numbers
    - URLs
    - Dates and times
    - Suspect identifiers
  - Store confidence scores and source context for extracted entities.

- **Narrative parsing**
  - Convert a free-text incident narrative into chronological events.
  - Extract timestamps, phone numbers, URLs, amounts, event descriptions, and event types.
  - Use Gemini when configured, with a client/server fallback parser when AI is unavailable.

- **Timeline and risk analysis**
  - Identify fraud indicators such as suspicious URLs, unauthorized/coerced transfers, credential harvesting, extortion language, and unverified contacts.
  - Assign event-level and overall risk scores/severity.
  - Produce a bank-clarification summary and key fraud flags.

- **Reporting**
  - Generate an executive incident summary.
  - Produce a modus-operandi description, bank dispute draft, cybercrime complaint draft, victim-action guidance, suspect dossier, and evidence-chain analysis.
  - Export a privacy-sanitized chronological CSV report.
  - Includes printable report/PDF-oriented UI components.

- **Privacy safeguards**
  - Redacts sensitive account/card-like numbers and the complainant's phone number in generated CSV output.
  - Keeps case state locally in the browser unless information is sent to the configured server/Gemini API for analysis.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS 4
- **Backend:** Node.js, Express, TypeScript/TSX
- **AI:** Google Gemini via `@google/genai` (optional)
- **Icons:** Lucide React
- **Animation:** Motion
- **Data storage:** Browser `localStorage` for the active incident
- **Evidence integrity:** Web Crypto API SHA-256

## Project Structure

```text
.
├── index.html
├── package.json
├── server.ts
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types/
    │   └── index.ts
    ├── data/
    │   └── sampleIncident.ts
    ├── components/
    │   ├── Navbar.tsx
    │   ├── HomeView.tsx
    │   ├── NewReportView.tsx
    │   ├── CreateIncidentView.tsx
    │   ├── EvidenceUploadView.tsx
    │   ├── EvidenceDashboardView.tsx
    │   ├── EvidenceModal.tsx
    │   ├── TimelineView.tsx
    │   ├── FraudAnalyticsCharts.tsx
    │   ├── ReportView.tsx
    │   └── PrintablePdfModal.tsx
    └── utils/
        ├── crypto.ts
        ├── forensicExtractor.ts
        ├── narrativeAgent.ts
        └── redactionAndCsv.ts
```

## Requirements

- Node.js 18+ recommended
- npm
- A Gemini API key if you want to use the server-side Gemini analysis features

## Installation

Clone or extract the project, then install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your Gemini API key if available:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

The application can also run without `GEMINI_API_KEY`; the project contains fallback parsing and risk-analysis logic for the relevant workflows.

## Development

Start the development server:

```bash
npm run dev
```

The Express server starts the Vite development middleware and serves the application at:

```text
http://localhost:3000
```

## Production Build

Build the frontend:

```bash
npm run build
```

Preview the Vite production build:

```bash
npm run preview
```

Run the server directly:

```bash
npm start
```

Type-check the project:

```bash
npm run lint
```

## API Endpoints

The Express server exposes the following endpoints:

### `GET /api/health`

Returns a basic server health response.

### `POST /api/analyze-evidence`

Sends evidence content to the configured Gemini model for evidence analysis when `GEMINI_API_KEY` is available.

### `POST /api/generate-report`

Generates structured incident-report content using the configured Gemini model.

### `POST /api/parse-narrative`

Parses a user-provided fraud narrative into chronological events.

### `POST /api/analyze-timeline-risk`

Analyzes parsed events for fraud indicators and produces event-level and overall risk information.

If Gemini is unavailable, the application can return a fallback result and use its built-in rule-based analysis.

## Evidence Processing Flow

A typical investigation flow is:

```text
Create Incident
      │
      ▼
Upload Evidence
      │
      ├── SHA-256 hash
      ├── Metadata
      └── Entity extraction
      │
      ▼
Evidence Dashboard
      │
      ▼
Chronological Timeline
      │
      ▼
Risk Analysis
      │
      ▼
Incident Report
      │
      ├── Bank dispute information
      ├── Cybercrime complaint draft
      ├── Suspect identifiers
      └── Sanitized CSV export
```

## Privacy and Security Notes

FraudTrace handles potentially sensitive financial and personal information. Before deploying it for real investigations:

1. Do not commit `.env.local` or API keys to source control.
2. Treat uploaded evidence and browser `localStorage` as sensitive.
3. Use HTTPS in production.
4. Review access controls before allowing multiple users to access the application.
5. Do not treat browser-side storage as a secure evidence vault for high-assurance forensic workflows.
6. Preserve original evidence separately when required by organizational, legal, or investigative procedures.
7. Review all automatically extracted entities before using them in an official complaint.
8. AI-generated summaries should be checked against the original evidence before submission.

## AI and Fallback Behavior

When `GEMINI_API_KEY` is configured, FraudTrace can use Gemini for richer evidence, narrative, timeline, and report analysis.

When the API key is missing or an AI request fails, the application has local fallback logic for important workflows. The fallback implementation uses deterministic pattern matching and rule-based scoring rather than generative AI.

Because automated extraction can produce false positives or miss information, all extracted values and generated narratives should be verified against the source evidence.

## Data Model

The main application types are defined in `src/types/index.ts`.

Key objects include:

- `Incident` — complete fraud case
- `EvidenceFile` — uploaded evidence artifact and its metadata
- `ExtractedEntity` — value extracted from evidence
- `TimelineEvent` — chronological case event
- `GeneratedReport` — structured investigation/report output
- `ParsedNarrativeEvent` — event extracted from a free-text narrative
- `RiskEnrichedEvent` — parsed event with fraud flags and risk information
- `TimelineRiskAnalysis` — aggregate risk analysis

## Resetting Local Case Data

The active incident is stored under:

```text
fraudtrace_active_incident
```

in browser `localStorage`.

To reset the locally stored case during development, clear the site's local storage in browser developer tools or use the application's sample/reset functionality.

## Limitations

- This version is primarily a client-side case-management application.
- The active incident is stored in browser `localStorage`; there is no persistent database layer in the included project.
- Evidence files are represented in the application state and may consume substantial browser storage.
- Entity extraction is pattern-based and should not be considered a definitive forensic identification system.
- Risk scores are analytical indicators, not legal or financial determinations.
- Gemini availability depends on API configuration, network access, model availability, and API limits.
- Production deployments should add authentication, authorization, secure server-side evidence storage, audit logging, encryption, retention controls, and appropriate forensic chain-of-custody procedures.

## Suggested Production Enhancements

For a production-grade deployment, consider adding:

- User authentication and role-based access control
- Encrypted object storage for evidence
- PostgreSQL or another durable database
- Immutable audit logs
- Server-side evidence hashing and verification
- Evidence versioning and chain-of-custody events
- Malware-safe file ingestion and sandboxed processing
- OCR/document parsing services
- Stronger PII redaction and configurable retention policies
- Rate limiting and API authentication
- Automated tests for extraction and redaction rules
- Formal deployment and backup procedures

## License

No license is specified in the supplied project. Add a `LICENSE` file before distributing or publishing the project if you intend to grant reuse rights.

## Disclaimer

FraudTrace is provided as a software project for organizing information and assisting with fraud-incident documentation. Automated outputs can contain errors. Always verify extracted data, timelines, risk indicators, and generated complaint/report text against the original evidence and obtain appropriate professional or legal guidance where necessary.

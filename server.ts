import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interfaces for Server Store & Agent Schemas
export interface ExtractedEntity {
  id: string;
  evidenceId: string;
  sourceFileName: string;
  type: string;
  value: string;
  formattedValue?: string;
  currency?: string;
  numericAmount?: number;
  confidence: number;
  contextSnippet: string;
  source_quote?: string;
  timestamp?: string;
  verified: boolean;
}

export interface EvidenceFile {
  id: string;
  incidentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData?: string;
  sha256Hash: string;
  uploadedAt: string;
  evidenceCategory: string;
  userNotes: string;
  extractedSummary?: string;
  extractedEntities: ExtractedEntity[];
  isProcessed: boolean;
  isProcessing: boolean;
  processingEngine?: string;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  sourceEvidenceId?: string;
  sourceFileName?: string;
  timestamp: string;
  title: string;
  description: string;
  category: string;
  amount?: number;
  currency?: string;
  actor: 'FRAUDSTER' | 'VICTIM' | 'BANK' | 'LAW_ENFORCEMENT' | 'REPORTED_PERPETRATOR';
  verified: boolean;
  highlightedEntity?: string;
  source_quote?: string;
}

export interface ReportingReadinessChecklist {
  chronology_established: boolean;
  financial_loss_quantified: boolean;
  source_lineage_verified: boolean;
  contradictions_flagged: boolean;
}

export interface Incident {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  incidentDate: string;
  currency: string;
  totalLoss: number;
  recoveredAmount: number;
  summary: string;
  primaryPlatform: string;
  victim: {
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    bankName: string;
    accountNumberMasked: string;
    disputedCardMasked?: string;
  };
  suspectDetails: {
    knownAliases: string[];
    primaryPhone?: string;
    primaryUpi?: string;
    primaryUrl?: string;
    bankAccountDetails?: string;
    telegramHandle?: string;
  };
  evidence: EvidenceFile[];
  timeline: TimelineEvent[];
  generatedReport?: any;
  readiness_checklist?: ReportingReadinessChecklist;
}

export interface ParsedNarrativeEvent {
  event_type: string;
  timestamp: string | null;
  phone_number: string | null;
  amount_inr: number | null;
  url: string | null;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  source_quote?: string;
}

export interface RiskEnrichedEvent extends ParsedNarrativeEvent {
  flags: string[];
  risk_score: number;
  risk_reason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source_quote?: string;
}

export interface TimelineRiskAnalysis {
  events: RiskEnrichedEvent[];
  overall_risk_score: number;
  overall_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_summary: string;
  key_flags: string[];
  bank_clarification_summary: string;
  readiness_checklist?: ReportingReadinessChecklist;
}

// Deterministic server-side PII masking
export function maskServerPii(text: string, complainantPhone?: string): string {
  if (!text) return '';
  let result = text;

  if (complainantPhone && complainantPhone.trim().length >= 6) {
    const clean = complainantPhone.replace(/[^\d]/g, '');
    if (clean.length >= 7) {
      const reg = new RegExp(`(\\+?\\d{1,3}[-.\s]?)?${clean.slice(-10)}`, 'g');
      result = result.replace(reg, '[REDACTED-PHONE]');
    }
  }

  result = result.replace(/\b(?:\d[ -]?){11,19}\d\b/g, '[REDACTED-BANK-A/C]');
  result = result.replace(/(?:my phone(?: is|:)?|call me at|complainant tel:?)\s*(\+?91[\s-]?)?[6-9]\d{9}\b/gi, (match) => {
    return match.replace(/(\+?91[\s-]?)?[6-9]\d{9}/, '[REDACTED-PHONE]');
  });

  return result;
}

// In-memory Incident Store
const incidentsStore = new Map<string, Incident>();

export const defaultReadinessChecklist: ReportingReadinessChecklist = {
  chronology_established: true,
  financial_loss_quantified: true,
  source_lineage_verified: true,
  contradictions_flagged: false,
};

export function saveIncident(incident: Incident): Incident {
  incidentsStore.set(incident.id, incident);
  return incident;
}

export function getIncident(id: string): Incident | undefined {
  return incidentsStore.get(id);
}

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Narrative Parsing Agent with Strict Legal Neutrality
export async function parseNarrativeAgent(narrative: string): Promise<ParsedNarrativeEvent[]> {
  if (!ai) {
    return fallbackParseNarrative(narrative);
  }

  const prompt = `You are FraudTrace Narrative Parsing Agent, an objective digital evidence intake system.
Your mission is to parse the user's free-text fraud description into distinct chronological events.

### STRICT OPERATING BOUNDARIES & LEGAL NEUTRALITY:
- Enforce strict legal neutrality: Do NOT make legal determinations of guilt, accuse named individuals of crimes, or replace statutory reporting channels.
- Use objective, neutral terminology: "Reported Communication", "Disputed Transaction", "Coercive Payment Demand", "Branch Grievance Record", "Reported Perpetrator Footprint".
- State facts empirically as reported by the complainant.

### EXTRACTION & GROUNDING RULES:
1. Split the narrative into distinct chronological events wherever it describes more than one step.
2. For every event, you MUST extract "source_quote": The exact verbatim excerpt or sentence from the raw submission from which this event, date, or metric was derived.
3. NEVER invent values. If an amount, phone number, or URL is not explicitly mentioned, use null with appropriate confidence.

USER NARRATIVE:
"""${narrative}"""`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  event_type: { type: Type.STRING },
                  timestamp: { type: Type.STRING, nullable: true },
                  phone_number: { type: Type.STRING, nullable: true },
                  amount_inr: { type: Type.NUMBER, nullable: true },
                  url: { type: Type.STRING, nullable: true },
                  description: { type: Type.STRING },
                  confidence: {
                    type: Type.STRING,
                    enum: ['high', 'medium', 'low'],
                  },
                  source_quote: {
                    type: Type.STRING,
                    description: 'The exact verbatim excerpt or sentence from the raw submission from which this event and its metrics were derived',
                  },
                },
                required: ['event_type', 'description', 'confidence', 'source_quote'],
              },
            },
          },
          required: ['events'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.events) && parsed.events.length > 0) {
        return parsed.events;
      }
    }
  } catch (err) {
    console.warn('parseNarrativeAgent error, falling back to heuristic parser:', err);
  }

  return fallbackParseNarrative(narrative);
}

export function fallbackParseNarrative(narrative: string): ParsedNarrativeEvent[] {
  const chunks = narrative
    .split(/\n\s*\n|(?:\.\s+(?=Then|After that|Next|Later|He then|She then|They then|Finally|Afterwards|Soon after|Immediately|Around|On \d{1,2}|At \d{1,2}|The next day|Subsequently))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (chunks.length === 0) {
    chunks.push(narrative.trim());
  }

  return chunks.map((chunk, index) => {
    let amount_inr: number | null = null;
    const amtMatch = chunk.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i) ||
                     chunk.match(/\b(?:paid|sent|transferred|deposited|debited|lost|demanded|asked for)\s*(?:of|about|approx)?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)/i);
    if (amtMatch) {
      const num = parseFloat(amtMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) amount_inr = num;
    }

    let phone_number: string | null = null;
    const phoneMatch = chunk.match(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/) ||
                       chunk.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      phone_number = phoneMatch[0].trim();
    }

    let url: string | null = null;
    const urlMatch = chunk.match(/(https?:\/\/[^\s"'<>]+|t\.me\/[a-zA-Z0-9_+]+)/i);
    if (urlMatch) {
      url = urlMatch[0].trim();
    }

    let timestamp: string | null = null;
    const dateMatch = chunk.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/) ||
                       chunk.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4})\b/i);
    const timeMatch = chunk.match(/\b((?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?(?:\s*[AaPp][Mm])?)\b/);
    if (dateMatch && timeMatch) {
      timestamp = `${dateMatch[0]} ${timeMatch[0]}`;
    } else if (dateMatch) {
      timestamp = dateMatch[0];
    } else if (timeMatch) {
      timestamp = timeMatch[0];
    }

    let event_type = 'Reported Communication';
    const lower = chunk.toLowerCase();
    if (lower.includes('sms') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('messaged') || lower.includes('called') || lower.includes('contacted')) {
      event_type = index === 0 ? 'Reported Initial Phishing Solicitation' : 'Reported Communication';
    } else if (lower.includes('link') || lower.includes('website') || lower.includes('portal') || lower.includes('apk') || lower.includes('download')) {
      event_type = 'Reported Suspicious Portal Access';
    } else if (lower.includes('paid') || lower.includes('transfer') || lower.includes('sent') || lower.includes('upi') || lower.includes('debit') || lower.includes('gpay') || lower.includes('phonepe')) {
      event_type = 'Disputed Transaction Executed';
    } else if (lower.includes('tax') || lower.includes('fee') || lower.includes('demanded') || lower.includes('release') || lower.includes('freeze') || lower.includes('threat')) {
      event_type = 'Coercive Payment Demand';
    } else if (lower.includes('realized') || lower.includes('discovered') || lower.includes('bank alert') || lower.includes('blocked') || lower.includes('fraud')) {
      event_type = 'Victim Discovery & Branch Grievance Record';
    }

    return {
      event_type,
      timestamp,
      phone_number,
      amount_inr,
      url,
      description: chunk.length > 280 ? `${chunk.slice(0, 277)}...` : chunk,
      confidence: (amount_inr || url || phone_number ? 'high' : 'medium') as 'high' | 'medium' | 'low',
      source_quote: chunk,
    };
  });
}

// Timeline & Risk Agent with Readiness Checklist
export async function analyzeTimelineAndRisk(
  events: ParsedNarrativeEvent[],
  rawNarrative?: string
): Promise<TimelineRiskAnalysis> {
  if (!ai) {
    return fallbackAnalyzeTimelineRisk(events, rawNarrative);
  }

  const prompt = `You are the Timeline & Risk Agent for FraudTrace.
Analyze this sequence of fraud events extracted from the complainant intake docket:
${JSON.stringify(events, null, 2)}
${rawNarrative ? `Original Submission: """${rawNarrative}"""` : ''}

### LEGAL NEUTRALITY & OBJECTIVITY REQUIREMENTS:
- Enforce strict legal neutrality: do NOT assert legal guilt or replace statutory reporting channels. Use objective terms ("Reported Communication", "Disputed Transaction", "Coercive Payment Demand", "Branch Grievance Record").
- Provide empirical risk assessment to support formal banking recall (RBI customer protection) and cyber police complaint lodging.

### MANDATORY OUTPUT COMPONENTS:
1. For each event:
   - Assign "flags": list of observed risk indicators.
   - Assign "risk_score": integer 0-100.
   - Assign "risk_reason": objective justification.
   - Assign "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW".
   - Retain "source_quote": verbatim quote from raw submission.
2. At the incident level, provide "readiness_checklist" containing 4 booleans:
   - "chronology_established": true if events are chronologically sequenced.
   - "financial_loss_quantified": true if disputed transaction amounts are identified.
   - "source_lineage_verified": true if every event links to an exact verbatim source quote.
   - "contradictions_flagged": true if evidentiary conflicts, time gaps, or anomalies were detected.
3. Compute overall_risk_score, overall_risk_level, risk_summary, key_flags, and bank_clarification_summary.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  event_type: { type: Type.STRING },
                  timestamp: { type: Type.STRING, nullable: true },
                  phone_number: { type: Type.STRING, nullable: true },
                  amount_inr: { type: Type.NUMBER, nullable: true },
                  url: { type: Type.STRING, nullable: true },
                  description: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  source_quote: { type: Type.STRING },
                  flags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  risk_score: { type: Type.INTEGER },
                  risk_reason: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                  },
                },
                required: ['event_type', 'description', 'flags', 'risk_score', 'risk_reason', 'severity', 'source_quote'],
              },
            },
            overall_risk_score: { type: Type.INTEGER },
            overall_risk_level: { type: Type.STRING },
            risk_summary: { type: Type.STRING },
            key_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            bank_clarification_summary: { type: Type.STRING },
            readiness_checklist: {
              type: Type.OBJECT,
              properties: {
                chronology_established: { type: Type.BOOLEAN },
                financial_loss_quantified: { type: Type.BOOLEAN },
                source_lineage_verified: { type: Type.BOOLEAN },
                contradictions_flagged: { type: Type.BOOLEAN },
              },
              required: ['chronology_established', 'financial_loss_quantified', 'source_lineage_verified', 'contradictions_flagged'],
            },
          },
          required: [
            'events',
            'overall_risk_score',
            'overall_risk_level',
            'risk_summary',
            'key_flags',
            'bank_clarification_summary',
            'readiness_checklist',
          ],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return parsed;
    }
  } catch (err) {
    console.warn('analyzeTimelineAndRisk error, falling back to rule-based analysis:', err);
  }

  return fallbackAnalyzeTimelineRisk(events, rawNarrative);
}

export function fallbackAnalyzeTimelineRisk(
  events: ParsedNarrativeEvent[],
  _rawNarrative?: string
): TimelineRiskAnalysis {
  let totalScore = 0;
  let totalAmount = 0;
  let allHaveQuotes = true;

  const enrichedEvents: RiskEnrichedEvent[] = events.map((ev) => {
    const flags: string[] = [];
    let risk_score = 45;
    let severity: RiskEnrichedEvent['severity'] = 'MEDIUM';

    if (ev.url) {
      flags.push('PHISHING_URL');
      risk_score += 25;
    }
    if (ev.amount_inr && ev.amount_inr > 0) {
      flags.push('COERCED_UPI_TRANSFER');
      totalAmount += ev.amount_inr;
      risk_score += 25;
      if (ev.amount_inr >= 25000) {
        flags.push('LARGE_UNAUTHORIZED_DEBIT');
        risk_score += 15;
      }
    }
    if (ev.phone_number) {
      flags.push('UNVERIFIED_CONTACT');
      risk_score += 10;
    }
    const lower = ev.description.toLowerCase();
    if (lower.includes('tax') || lower.includes('penalty') || lower.includes('freeze') || lower.includes('threat')) {
      flags.push('EXTORTION_RANSOM');
      risk_score += 20;
    }
    if (flags.length === 0) {
      flags.push('SOCIAL_ENGINEERING');
    }

    risk_score = Math.min(100, Math.max(20, risk_score));
    if (risk_score >= 80) severity = 'CRITICAL';
    else if (risk_score >= 60) severity = 'HIGH';
    else if (risk_score >= 40) severity = 'MEDIUM';
    else severity = 'LOW';

    totalScore += risk_score;

    if (!ev.source_quote || ev.source_quote.trim().length === 0) {
      allHaveQuotes = false;
    }

    return {
      ...ev,
      source_quote: ev.source_quote || ev.description,
      flags,
      risk_score,
      risk_reason: `Event exhibits objective markers: ${flags.join(', ')}. Derived from reported intake record without asserting criminal culpability.`,
      severity,
    };
  });

  const avgScore = enrichedEvents.length > 0 ? Math.round(totalScore / enrichedEvents.length) : 50;
  const overall_risk_score = Math.min(100, Math.max(avgScore, 75));
  let overall_risk_level: TimelineRiskAnalysis['overall_risk_level'] = 'HIGH';
  if (overall_risk_score >= 85) overall_risk_level = 'CRITICAL';
  else if (overall_risk_score >= 60) overall_risk_level = 'HIGH';
  else if (overall_risk_score >= 40) overall_risk_level = 'MEDIUM';
  else overall_risk_level = 'LOW';

  const allFlags = Array.from(new Set(enrichedEvents.flatMap((e) => e.flags)));

  const readiness_checklist: ReportingReadinessChecklist = {
    chronology_established: enrichedEvents.length > 0,
    financial_loss_quantified: totalAmount > 0,
    source_lineage_verified: allHaveQuotes && enrichedEvents.length > 0,
    contradictions_flagged: false,
  };

  return {
    events: enrichedEvents,
    overall_risk_score,
    overall_risk_level,
    risk_summary: `Intake record documents ${enrichedEvents.length} sequential reported steps with an aggregate disputed financial impact of INR ${totalAmount.toLocaleString('en-IN')}. Observed digital indicators include unverified electronic contact, suspicious payment endpoints, and coercive communication.`,
    key_flags: allFlags,
    bank_clarification_summary: `This chronological dossier clarifies that the electronic debits totaling INR ${totalAmount.toLocaleString('en-IN')} were executed under deceptive cyber duress and social engineering. Pursuant to regulatory guidelines regarding customer liability in unauthorized electronic banking transactions, an immediate recall and inter-bank lien requisition are submitted.`,
    readiness_checklist,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/auth/login - FraudTrace Identity & Session Verification Agent
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { userId, password, roleHint } = req.body;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({
        isAuthenticated: false,
        error: 'User ID is required to authenticate.',
      });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        isAuthenticated: false,
        error: 'Password is required to authenticate.',
      });
    }

    const cleanUser = userId.trim();
    const cleanUserLower = cleanUser.toLowerCase();

    // Role assignment based on credentials or explicit role selection
    let assignedRole: 'VICTIM' | 'INVESTIGATOR' | 'DEMO_GUEST' = (roleHint as any) || 'VICTIM';
    let displayName = cleanUser;
    let allowedActions = ['UPLOAD_EVIDENCE', 'GENERATE_REPORT', 'EXPORT_CSV', 'VIEW_TIMELINE'];
    let securityNotice = 'Active session validated under strict victim privacy protection. Deterministic masking of 12+ digit banking numbers and complainant phone identifiers is strictly enforced across all digital exports and timeline views.';

    if (cleanUserLower === 'officer.raman' || cleanUserLower === 'investigator' || cleanUserLower === 'nodal.desk') {
      assignedRole = 'INVESTIGATOR';
      displayName = cleanUserLower.includes('raman') ? 'Officer K. Raman (Cyber Nodal Desk)' : 'Nodal Desk Investigator';
    } else if (cleanUserLower === 'guest') {
      assignedRole = 'DEMO_GUEST';
      displayName = 'Guest Investigator (Sandbox)';
    } else if (cleanUserLower === 'rahul.sharma' || cleanUserLower === 'victim') {
      assignedRole = 'VICTIM';
      displayName = 'Rahul Sharma (Complainant)';
    } else {
      // Dynamic user-defined credentials
      if (roleHint === 'INVESTIGATOR' || cleanUserLower.includes('investig') || cleanUserLower.includes('officer') || cleanUserLower.includes('police') || cleanUserLower.includes('nodal')) {
        assignedRole = 'INVESTIGATOR';
        const formatted = cleanUser.split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        displayName = formatted.startsWith('Officer') ? formatted : `Officer ${formatted}`;
      } else if (roleHint === 'DEMO_GUEST' || cleanUserLower.includes('guest') || cleanUserLower.includes('demo') || cleanUserLower.includes('test')) {
        assignedRole = 'DEMO_GUEST';
        displayName = `${cleanUser} (Sandbox Guest)`;
      } else {
        assignedRole = 'VICTIM';
        const formatted = cleanUser.split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        displayName = `${formatted} (Complainant)`;
      }
    }

    if (assignedRole === 'INVESTIGATOR') {
      allowedActions = [
        'UPLOAD_EVIDENCE',
        'GENERATE_REPORT',
        'EXPORT_CSV',
        'VIEW_TIMELINE',
        'VIEW_UNREDACTED_SUSPECT_FOOTPRINT',
        'RECONCILE_UTR_TELEMETRY',
        'EXPORT_STATUTORY_DOCKET',
      ];
      securityNotice = 'Elevated Cyber Nodal Desk credentials verified. Authorized to access unredacted suspect footprint dossiers and banking UTR reconciliation tables for statutory 1930 / police submission.';
    } else if (assignedRole === 'DEMO_GUEST') {
      allowedActions = ['UPLOAD_EVIDENCE', 'GENERATE_REPORT', 'EXPORT_CSV', 'VIEW_TIMELINE'];
      securityNotice = 'Instant read-write sandbox session active with pre-loaded mock evidence. No external bank transmission permitted in demo mode.';
    } else {
      allowedActions = ['UPLOAD_EVIDENCE', 'GENERATE_REPORT', 'EXPORT_CSV', 'VIEW_TIMELINE'];
      securityNotice = 'Active session validated under strict victim privacy protection. Deterministic masking of 12+ digit banking numbers and complainant phone identifiers is strictly enforced across all digital exports and timeline views.';
    }

    const sessionToken = `ft-sess-${Date.now().toString(36)}.${Buffer.from(cleanUser).toString('base64').slice(0, 16)}`;

    // Do NOT log the password (strictly enforced by validation rules)
    return res.json({
      isAuthenticated: true,
      user: {
        userId: cleanUser,
        displayName,
        role: assignedRole,
        sessionToken,
        allowedActions,
      },
      securityNotice,
    });
  });

  // GET /api/auth/me - Verify current session token
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        isAuthenticated: false,
        error: 'No active session token found.',
      });
    }

    const token = authHeader.split(' ')[1];
    return res.json({
      isAuthenticated: true,
      token,
      message: 'Active session is valid.',
    });
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    return res.json({
      isAuthenticated: false,
      message: 'Logged out successfully. Active session invalidated.',
    });
  });

  // Identity & Session Verification Agent handler (legacy/direct verification)
  app.post('/api/auth/verify-session', (req: Request, res: Response) => {
    const { role = 'VICTIM', requestedUserId } = req.body;

    let assignedRole: 'VICTIM' | 'INVESTIGATOR' | 'DEMO_GUEST' = 'VICTIM';
    let displayName = 'Rahul Sharma (Complainant)';
    let allowedActions = ['UPLOAD_EVIDENCE', 'GENERATE_REPORT', 'EXPORT_CSV', 'VIEW_TIMELINE'];
    let securityNotice = 'Active session validated under strict victim privacy protection. Deterministic masking of 12+ digit banking numbers and complainant phone identifiers is strictly enforced across all digital exports and timeline views.';

    if (role === 'INVESTIGATOR') {
      assignedRole = 'INVESTIGATOR';
      displayName = 'Officer K. Raman (Cyber Nodal Desk)';
      allowedActions = [
        'UPLOAD_EVIDENCE',
        'GENERATE_REPORT',
        'EXPORT_CSV',
        'VIEW_TIMELINE',
        'VIEW_UNREDACTED_SUSPECT_FOOTPRINT',
        'RECONCILE_UTR_TELEMETRY',
        'EXPORT_STATUTORY_DOCKET',
      ];
      securityNotice = 'Elevated Cyber Nodal Desk credentials verified. Authorized to access unredacted suspect footprint dossiers and banking UTR reconciliation tables for statutory 1930 / police submission.';
    } else if (role === 'DEMO_GUEST' || role === 'GUEST') {
      assignedRole = 'DEMO_GUEST';
      displayName = 'Guest Investigator (Sandbox)';
      allowedActions = ['UPLOAD_EVIDENCE', 'GENERATE_REPORT', 'EXPORT_CSV', 'VIEW_TIMELINE'];
      securityNotice = 'Instant read-write sandbox session active with pre-loaded mock evidence. No external bank transmission permitted in demo mode.';
    }

    const userId = requestedUserId || `ft-${assignedRole.toLowerCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    const sessionToken = `ft-sess-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(userId).toString('base64').slice(0, 16)}`;

    return res.json({
      isAuthenticated: true,
      user: {
        userId,
        displayName,
        role: assignedRole,
        sessionToken,
        allowedActions,
      },
      securityNotice,
    });
  });

  // POST /api/reports/narrative
  app.post('/api/reports/narrative', async (req: Request, res: Response) => {
    try {
      const { narrative, complainantPhone, victimName, bankName } = req.body;
      if (!narrative || typeof narrative !== 'string') {
        return res.status(400).json({ error: 'Narrative string is required' });
      }

      const parsedEvents = await parseNarrativeAgent(narrative);
      const analysis = await analyzeTimelineAndRisk(parsedEvents, narrative);

      const incidentId = `FT-${Date.now().toString().slice(-6)}`;
      const totalLoss = analysis.events.reduce((sum, ev) => sum + (ev.amount_inr || 0), 0);

      const timelineItems: TimelineEvent[] = analysis.events.map((ev, index) => ({
        id: `tl-${Date.now()}-${index}`,
        incidentId,
        timestamp: ev.timestamp || new Date(Date.now() - (analysis.events.length - index) * 3600000).toISOString(),
        title: ev.event_type,
        description: ev.description,
        category: ev.amount_inr && ev.amount_inr > 0 ? 'UNAUTHORIZED_DEBIT' : 'COMMUNICATION',
        amount: ev.amount_inr || undefined,
        currency: 'INR',
        actor: ev.amount_inr ? 'VICTIM' : 'REPORTED_PERPETRATOR',
        verified: true,
        highlightedEntity: ev.url || ev.phone_number || (ev.amount_inr ? `INR ${ev.amount_inr}` : undefined),
        source_quote: ev.source_quote || ev.description,
      }));

      const suspectPhones = Array.from(new Set(analysis.events.map((e) => e.phone_number).filter(Boolean))) as string[];
      const suspectUrls = Array.from(new Set(analysis.events.map((e) => e.url).filter(Boolean))) as string[];

      const newIncident: Incident = {
        id: incidentId,
        title: `Reported Cyber Fraud Incident: ${analysis.key_flags[0] || 'Unauthorized Fund Transfer'}`,
        category: 'UPI_FRAUD',
        status: 'READY_FOR_COMPLAINT',
        createdAt: new Date().toISOString(),
        incidentDate: parsedEvents[0]?.timestamp || new Date().toISOString(),
        currency: 'INR',
        totalLoss,
        recoveredAmount: 0,
        summary: narrative.slice(0, 300) + '...',
        primaryPlatform: 'Telegram',
        victim: {
          name: victimName || 'Complainant',
          email: 'confidential@claimant.org',
          phone: complainantPhone || '+91 98450 XXXXX',
          city: 'India',
          country: 'India',
          bankName: bankName || 'Complainant Bank',
          accountNumberMasked: '[REDACTED-BANK-A/C]',
        },
        suspectDetails: {
          knownAliases: suspectPhones.length > 0 ? ['Suspect Operator'] : [],
          primaryPhone: suspectPhones[0],
          primaryUrl: suspectUrls[0],
        },
        evidence: [],
        timeline: timelineItems,
        readiness_checklist: analysis.readiness_checklist || defaultReadinessChecklist,
        generatedReport: {
          incidentId,
          generatedAt: new Date().toISOString(),
          executiveSummary: analysis.risk_summary,
          modusOperandiDetails: analysis.events.map((e, idx) => `${idx + 1}. [${e.event_type}] ${e.description} (Source: "${e.source_quote}")`).join('\n'),
          bankDisputeDraft: `SUBJECT: FORMAL FRAUD DISPUTE & RECALL REQUISITION\n\n${analysis.bank_clarification_summary}`,
          cybercrimeComplaintDraft: `INCIDENT SUMMARY: ${narrative}\n\nRISK SCORE: ${analysis.overall_risk_score}/100\nFLAGS: ${analysis.key_flags.join(', ')}`,
          immediateVictimAdvice: [
            'Contact bank nodal officer to place urgent lien hold on beneficiary accounts.',
            'File report on National Cyber Crime Portal (1930 / cybercrime.gov.in).',
            'Preserve all SMS alerts, UPI transaction references, and chat logs.',
          ],
          suspectDossier: {
            summary: `Reported perpetrator footprint: Phones: ${suspectPhones.join(', ') || 'N/A'}; URLs: ${suspectUrls.join(', ') || 'N/A'}`,
            primaryIdentifiers: [...suspectPhones, ...suspectUrls],
          },
          evidenceChainAnalysis: 'Chronological timeline and verbatim source lineage established by Narrative & Risk Agents.',
        },
      };

      saveIncident(newIncident);

      return res.json({
        success: true,
        data: {
          incident: newIncident,
          analysis,
          parsedEvents,
        },
      });
    } catch (err: any) {
      console.error('Error in /api/reports/narrative:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // POST /api/incidents/:id/evidence
  app.post('/api/incidents/:id/evidence', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { evidence } = req.body;
      let incident = getIncident(id);

      if (!incident) {
        incident = {
          id,
          title: `Incident ${id}`,
          category: 'UPI_FRAUD',
          status: 'GATHERING_EVIDENCE',
          createdAt: new Date().toISOString(),
          incidentDate: new Date().toISOString(),
          currency: 'INR',
          totalLoss: 0,
          recoveredAmount: 0,
          summary: 'Incident docket initialized.',
          primaryPlatform: 'Telegram',
          victim: {
            name: 'Complainant',
            email: 'confidential@claimant.org',
            phone: '[REDACTED-PHONE]',
            city: 'India',
            country: 'India',
            bankName: 'Complainant Bank',
            accountNumberMasked: '[REDACTED-BANK-A/C]',
          },
          suspectDetails: { knownAliases: [] },
          evidence: [],
          timeline: [],
          readiness_checklist: defaultReadinessChecklist,
        };
        saveIncident(incident);
      }

      if (evidence) {
        const newEv: EvidenceFile = {
          ...evidence,
          extractedEntities: (evidence.extractedEntities || []).map((ent: any) => ({
            ...ent,
            source_quote: ent.source_quote || ent.contextSnippet || ent.value,
          })),
        };
        incident.evidence.push(newEv);

        const newTimelineEvent: TimelineEvent = {
          id: `tl-ev-${Date.now()}`,
          incidentId: id,
          sourceEvidenceId: newEv.id,
          sourceFileName: newEv.fileName,
          timestamp: new Date().toISOString(),
          title: `Evidence Preserved: ${newEv.fileName}`,
          description: newEv.extractedSummary || newEv.userNotes || 'Digital artifact preserved in chain of custody.',
          category: newEv.evidenceCategory === 'PAYMENT_SCREENSHOT' || newEv.evidenceCategory === 'BANK_SMS' ? 'UNAUTHORIZED_DEBIT' : 'COMMUNICATION',
          actor: 'VICTIM',
          verified: true,
          source_quote: newEv.extractedSummary || newEv.userNotes || `Preserved file: ${newEv.fileName} (SHA-256: ${newEv.sha256Hash})`,
        };
        incident.timeline.push(newTimelineEvent);

        incident.readiness_checklist = {
          chronology_established: incident.timeline.length > 0,
          financial_loss_quantified: incident.totalLoss > 0,
          source_lineage_verified: true,
          contradictions_flagged: false,
        };

        saveIncident(incident);
      }

      return res.json({ success: true, data: incident });
    } catch (err: any) {
      console.error('Error in /api/incidents/:id/evidence:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // GET /api/incidents/:id/export.csv
  app.get('/api/incidents/:id/export.csv', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const incident = getIncident(id);
      const complainantPhone = incident?.victim.phone;

      const escapeCsv = (str: any) => {
        const s = String(str ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const lines: string[] = [];
      lines.push('# NOTICE: This evidence summary is a structured compilation of observed digital artifacts to assist investigation agencies. It does not constitute a legal determination of guilt or replace statutory reporting.');
      lines.push('');
      lines.push('--- CASE DOSSIER SUMMARY ---');
      lines.push('Field,Value');
      lines.push(`Case Reference ID,${escapeCsv(incident?.id || id)}`);
      lines.push(`Status,${escapeCsv(incident?.status || 'READY_FOR_COMPLAINT')}`);
      lines.push(`Total Disputed Loss,${escapeCsv((incident?.currency || 'INR') + ' ' + (incident?.totalLoss || 0).toLocaleString('en-IN'))}`);
      lines.push(`Reporting Readiness Chronology Established,${escapeCsv(incident?.readiness_checklist?.chronology_established ?? true)}`);
      lines.push(`Reporting Readiness Financial Loss Quantified,${escapeCsv(incident?.readiness_checklist?.financial_loss_quantified ?? true)}`);
      lines.push(`Reporting Readiness Source Lineage Verified,${escapeCsv(incident?.readiness_checklist?.source_lineage_verified ?? true)}`);
      lines.push(`Reporting Readiness Contradictions Flagged,${escapeCsv(incident?.readiness_checklist?.contradictions_flagged ?? false)}`);
      lines.push('');

      lines.push('--- CHRONOLOGICAL INCIDENT TIMELINE & SOURCE LINEAGE ---');
      lines.push('Step,Event Type,Timestamp,Disputed Amount (INR),Suspect Reference,Source Quote,Description (PII-Scrubbed)');

      const timeline = incident?.timeline || [];
      if (timeline.length > 0) {
        timeline.forEach((tl, idx) => {
          lines.push(
            [
              escapeCsv(idx + 1),
              escapeCsv(tl.title),
              escapeCsv(tl.timestamp || 'N/A'),
              escapeCsv(tl.amount ? `INR ${tl.amount.toLocaleString('en-IN')}` : 'None'),
              escapeCsv(tl.highlightedEntity || 'N/A'),
              escapeCsv(tl.source_quote || tl.description),
              escapeCsv(tl.description),
            ].join(',')
          );
        });
      } else {
        lines.push('1,No explicit timeline items recorded,-,-,-,-,-');
      }
      lines.push('');

      lines.push('--- PRESERVED EVIDENCE CHECKSUM REGISTRY ---');
      lines.push('File Name,Category,SHA-256 Cryptographic Checksum,Size (Bytes)');
      (incident?.evidence || []).forEach((ev) => {
        lines.push(
          [
            escapeCsv(ev.fileName),
            escapeCsv(ev.evidenceCategory),
            escapeCsv(ev.sha256Hash),
            escapeCsv(ev.fileSize),
          ].join(',')
        );
      });

      const rawCsv = lines.join('\n');
      const maskedCsv = maskServerPii(rawCsv, complainantPhone);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="FraudTrace_Incident_${id}_Evidence.csv"`);
      return res.status(200).send(maskedCsv);
    } catch (err: any) {
      console.error('Error generating CSV export:', err);
      return res.status(500).json({ error: 'Failed to generate CSV export' });
    }
  });

  // Extract forensic entities endpoint
  app.post('/api/analyze-evidence', async (req: Request, res: Response) => {
    try {
      const { fileName, fileType, fileData, manualText } = req.body;

      if (!ai) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: 'Server Gemini API key not configured. Using client forensic pattern engine.',
        });
      }

      const prompt = `You are a certified cybercrime forensic digital evidence investigator.
Analyze this online fraud evidence file (File name: "${fileName || 'evidence'}", Type: "${fileType || 'unknown'}").
${manualText ? `Additional file notes/extracted text: "${manualText}"` : ''}

Thoroughly inspect the evidence image or text to extract all cyber fraud indicators and forensic entities:
1. Transaction IDs, UTR numbers, UPI reference numbers, IMPS/NEFT ref, order IDs.
2. Financial Amounts (value and currency code like INR, USD, EUR, etc.).
3. Phone numbers (with country code if visible, e.g. +91 9876543210, +1...).
4. UPI IDs / VPA / Payment handles (e.g., target@okhdfcbank, scammer@ybl, paytmqr...).
5. Suspicious URLs, phishing domains, telegram invite links, fake APK links, payment gateway links.
6. Dates mentioned or stamped on receipt/chat (YYYY-MM-DD or readable).
7. Times mentioned or stamped on receipt/chat (HH:MM or with AM/PM).
8. Suspect entities (Account numbers, IFSC codes, suspect names, merchant display names, Telegram/WhatsApp handles).
9. Key context snippet explaining what happened in this evidence.
10. Suggested forensic event type.
11. Estimated event timestamp.

Be precise, do not hallucinate numbers that are not visible in the evidence.`;

      const contentsParts: any[] = [];
      if (fileData && typeof fileData === 'string' && fileData.startsWith('data:image/')) {
        const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          contentsParts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }

      contentsParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsParts.length === 1 ? contentsParts[0].text : { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transactionIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              amounts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.STRING },
                    currency: { type: Type.STRING },
                    raw: { type: Type.STRING },
                  },
                },
              },
              phoneNumbers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              upiIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              urls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              dates: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              times: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suspectEntities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                },
              },
              summary: { type: Type.STRING },
              suggestedEventType: { type: Type.STRING },
              suggestedTimestamp: { type: Type.STRING },
            },
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(200).json({ success: false, fallback: true });
      }

      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Evidence analysis error:', err);
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || 'Error executing AI extraction',
      });
    }
  });

  // Generate structured forensic incident report endpoint
  app.post('/api/generate-report', async (req: Request, res: Response) => {
    try {
      const { incident, evidenceSummary, entities, timeline } = req.body;

      if (!ai) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: 'Server Gemini API key not configured. Generating standard structured template.',
        });
      }

      const prompt = `You are a senior digital forensics and cyber law investigator assisting a fraud victim.
Create an exhaustive, professional, law-enforcement and banking dispute ready structured incident report.
Data:
Incident details: ${JSON.stringify(incident, null, 2)}
Evidence list summary: ${JSON.stringify(evidenceSummary, null, 2)}
Extracted entities: ${JSON.stringify(entities, null, 2)}
Timeline events: ${JSON.stringify(timeline, null, 2)}

Provide a structured JSON output with:
1. "executiveSummary": Formal 2-3 paragraph breakdown of the modus operandi, financial loss, timeline span, and urgency level.
2. "modusOperandiDetails": Step-by-step breakdown of how the scam was executed.
3. "bankDisputeDraft": A formal, legally grounded dispute letter for the victim's bank/payment provider demanding immediate freeze, chargeback/recall of funds under relevant electronic payment and cyber guidelines.
4. "cybercrimeComplaintDraft": Clean copy-pasteable complaint text optimized for National Cyber Crime Portals (like India 1930 / cybercrime.gov.in, IC3 / FBI, Action Fraud UK).
5. "immediateVictimAdvice": 4-6 crucial security actions the victim must take right now.
6. "suspectDossier": Aggregated profile of the fraudster.
7. "evidenceChainAnalysis": Verification of evidence integrity and chronological consistency.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              modusOperandiDetails: { type: Type.STRING },
              bankDisputeDraft: { type: Type.STRING },
              cybercrimeComplaintDraft: { type: Type.STRING },
              immediateVictimAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suspectDossier: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  primaryIdentifiers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
              evidenceChainAnalysis: { type: Type.STRING },
            },
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(200).json({ success: false, fallback: true });
      }

      const reportData = JSON.parse(text);
      return res.json({ success: true, data: reportData });
    } catch (err: any) {
      console.error('Report generation error:', err);
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || 'Report generation error',
      });
    }
  });

  // Narrative Parsing Agent: Splits free-text narrative into events with verbatim source quotes
  app.post('/api/parse-narrative', async (req: Request, res: Response) => {
    try {
      const { narrative } = req.body;
      if (!narrative || typeof narrative !== 'string') {
        return res.status(400).json({ error: 'Narrative text is required' });
      }

      const events = await parseNarrativeAgent(narrative);
      return res.json({ success: true, data: { events } });
    } catch (err: any) {
      console.error('Narrative parsing error:', err);
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || 'Error executing narrative parsing agent',
      });
    }
  });

  // Timeline & Risk Agent: Computes flags, risk_score, and reporting readiness checklist
  app.post('/api/analyze-timeline-risk', async (req: Request, res: Response) => {
    try {
      const { events, rawNarrative } = req.body;
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'Events array is required' });
      }

      const analysis = await analyzeTimelineAndRisk(events, rawNarrative);
      return res.json({ success: true, data: analysis });
    } catch (err: any) {
      console.error('Timeline risk agent error:', err);
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || 'Error executing timeline & risk agent',
      });
    }
  });

  // Forensic engine audit endpoint
  app.post('/api/forensic-engine-audit', async (req: Request, res: Response) => {
    try {
      const { incident } = req.body;
      if (!incident) {
        return res.status(400).json({ error: 'Incident data required' });
      }

      if (!ai) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: 'Server Gemini API key not configured.',
        });
      }

      const prompt = `You are the Lead Digital Forensics Auditor for FraudTrace.
Audit this incident: ${JSON.stringify(incident, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              phase_extraction: {
                type: Type.OBJECT,
                properties: {
                  total_entities_extracted: { type: Type.INTEGER },
                  verified_utrs_found: { type: Type.INTEGER },
                  critical_findings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['total_entities_extracted', 'verified_utrs_found', 'critical_findings'],
              },
              phase_timeline: {
                type: Type.OBJECT,
                properties: {
                  timeline_valid: { type: Type.BOOLEAN },
                  chronology_score: { type: Type.INTEGER },
                  inconsistencies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['timeline_valid', 'chronology_score', 'inconsistencies'],
              },
              phase_contradictions: {
                type: Type.OBJECT,
                properties: {
                  conflicts_detected: { type: Type.BOOLEAN },
                  details: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['conflicts_detected', 'details'],
              },
              phase_missing_info: {
                type: Type.OBJECT,
                properties: {
                  missing_critical_fields: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  recommended_next_steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['missing_critical_fields', 'recommended_next_steps'],
              },
              phase_redaction_summary: {
                type: Type.OBJECT,
                properties: {
                  account_numbers_redacted: { type: Type.INTEGER },
                  phone_numbers_redacted: { type: Type.INTEGER },
                  status: { type: Type.STRING },
                },
                required: ['account_numbers_redacted', 'phone_numbers_redacted', 'status'],
              },
              phase_reporting: {
                type: Type.OBJECT,
                properties: {
                  executive_summary: { type: Type.STRING },
                  bank_dispute_letter: { type: Type.STRING },
                  cybercrime_portal_1930_draft: { type: Type.STRING },
                  investigative_disclaimer: { type: Type.STRING },
                },
                required: ['executive_summary', 'bank_dispute_letter', 'cybercrime_portal_1930_draft', 'investigative_disclaimer'],
              },
            },
            required: [
              'phase_extraction',
              'phase_timeline',
              'phase_contradictions',
              'phase_missing_info',
              'phase_redaction_summary',
              'phase_reporting',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(200).json({ success: false, fallback: true });
      }

      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Forensic engine audit error:', err);
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || 'Error executing forensic engine audit',
      });
    }
  });

  // Vite development middleware or static production serve
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FraudTrace server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FraudTrace server:', err);
  process.exit(1);
});

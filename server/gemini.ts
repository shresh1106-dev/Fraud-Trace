import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { ParsedNarrativeEvent, RiskEnrichedEvent, TimelineRiskAnalysis, ReportingReadinessChecklist } from '../src/types';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Narrative Parsing Agent
 * Enforces strict legal neutrality, extracts events, and captures verbatim source_quote.
 */
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
1. Split the narrative into distinct chronological events wherever it describes more than one step (e.g. initial contact, suspicious link, payment transfer, extortion demand, fraud realization).
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

/**
 * Timeline & Risk Agent
 * Computes flags, risk scores, justifications, and incident-level readiness_checklist.
 */
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
   - Assign "flags": list of observed risk indicators (e.g. "PHISHING_URL", "COERCED_UPI_TRANSFER", "UNVERIFIED_CONTACT", "SOCIAL_ENGINEERING", "LARGE_UNAUTHORIZED_DEBIT", "IMPERSONATION", "EXTORTION_RANSOM").
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

/**
 * Fallback parser that guarantees exact source_quote extraction
 */
export function fallbackParseNarrative(narrative: string): ParsedNarrativeEvent[] {
  const chunks = narrative
    .split(/\n\s*\n|(?:\.\s+(?=Then|After that|Next|Later|He then|She then|They then|Finally|Afterwards|Soon after|Immediately|Around|On \d{1,2}|At \d{1,2}|The next day|Subsequently))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (chunks.length === 0) {
    chunks.push(narrative.trim());
  }

  return chunks.map((chunk, index) => {
    // 1. Amount
    let amount_inr: number | null = null;
    const amtMatch = chunk.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i) ||
                     chunk.match(/\b(?:paid|sent|transferred|deposited|debited|lost|demanded|asked for)\s*(?:of|about|approx)?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)/i);
    if (amtMatch) {
      const num = parseFloat(amtMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) amount_inr = num;
    }

    // 2. Phone
    let phone_number: string | null = null;
    const phoneMatch = chunk.match(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/) ||
                       chunk.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      phone_number = phoneMatch[0].trim();
    }

    // 3. URL
    let url: string | null = null;
    const urlMatch = chunk.match(/(https?:\/\/[^\s"'<>]+|t\.me\/[a-zA-Z0-9_+]+)/i);
    if (urlMatch) {
      url = urlMatch[0].trim();
    }

    // 4. Timestamp
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

    // 5. Objective event_type
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
      source_quote: chunk, // Exact verbatim sentence from raw text
    };
  });
}

/**
 * Fallback risk analyzer with full readiness checklist computation
 */
export function fallbackAnalyzeTimelineRisk(
  events: ParsedNarrativeEvent[],
  rawNarrative?: string
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

  // 4 Boolean checklist verification
  const readiness_checklist: ReportingReadinessChecklist = {
    chronology_established: enrichedEvents.length > 0,
    financial_loss_quantified: totalAmount > 0,
    source_lineage_verified: allHaveQuotes && enrichedEvents.length > 0,
    contradictions_flagged: false, // Default false unless genuine conflict is noted
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

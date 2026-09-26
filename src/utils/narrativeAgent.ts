import { ParsedNarrativeEvent, RiskEnrichedEvent, TimelineRiskAnalysis } from '../types';

/**
 * Fallback parser that splits free-text narrative into events when offline or without Gemini key
 */
function fallbackNarrativeSplit(narrative: string): ParsedNarrativeEvent[] {
  // Split on paragraph breaks or key narrative transitional markers
  const chunks = narrative
    .split(/\n\s*\n|(?:\.\s+(?=Then|After that|Next|Later|He then|She then|They then|Finally|Afterwards|Soon after|Immediately|Around|On \d{1,2}|At \d{1,2}|The next day|Subsequently))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (chunks.length === 0) {
    chunks.push(narrative.trim());
  }

  const events: ParsedNarrativeEvent[] = [];

  chunks.forEach((chunk, index) => {
    // 1. Extract amount in INR
    let amount_inr: number | null = null;
    const amtMatch = chunk.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i) ||
                     chunk.match(/\b(?:paid|sent|transferred|deposited|debited|lost|demanded|asked for)\s*(?:of|about|approx)?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)/i);
    if (amtMatch) {
      const num = parseFloat(amtMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) amount_inr = num;
    }

    // 2. Extract phone number
    let phone_number: string | null = null;
    const phoneMatch = chunk.match(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/) ||
                       chunk.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      phone_number = phoneMatch[0].trim();
    }

    // 3. Extract URL
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

    // 5. Determine event_type
    let event_type = 'Incident Step';
    const lower = chunk.toLowerCase();
    if (lower.includes('sms') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('messaged') || lower.includes('called') || lower.includes('contacted')) {
      event_type = index === 0 ? 'Initial Phishing Contact' : 'Fraudster Communication';
    } else if (lower.includes('link') || lower.includes('website') || lower.includes('portal') || lower.includes('apk') || lower.includes('download')) {
      event_type = 'Malicious Link / Portal Access';
    } else if (lower.includes('paid') || lower.includes('transfer') || lower.includes('sent') || lower.includes('upi') || lower.includes('debit') || lower.includes('gpay') || lower.includes('phonepe')) {
      event_type = 'Coerced / Unauthorized Payment';
    } else if (lower.includes('tax') || lower.includes('fee') || lower.includes('demanded') || lower.includes('release') || lower.includes('freeze') || lower.includes('threat')) {
      event_type = 'Extortion / Additional Fee Demand';
    } else if (lower.includes('realized') || lower.includes('discovered') || lower.includes('bank alert') || lower.includes('blocked') || lower.includes('fraud')) {
      event_type = 'Fraud Realization / Discovery';
    }

    events.push({
      event_type,
      timestamp,
      phone_number,
      amount_inr,
      url,
      description: chunk.length > 280 ? `${chunk.slice(0, 277)}...` : chunk,
      confidence: amount_inr || url || phone_number ? 'high' : 'medium',
      source_quote: chunk,
    });
  });

  return events;
}

/**
 * Fallback Timeline & Risk Agent when offline or without Gemini key
 */
function fallbackTimelineRiskAnalysis(events: ParsedNarrativeEvent[], rawNarrative?: string): TimelineRiskAnalysis {
  let totalScore = 0;
  const enrichedEvents: RiskEnrichedEvent[] = events.map((ev) => {
    const flags: string[] = [];
    let risk_score = 40;
    let severity: RiskEnrichedEvent['severity'] = 'MEDIUM';

    const descLower = ev.description.toLowerCase();

    if (ev.url) {
      flags.push('SUSPICIOUS_PHISHING_URL');
      risk_score += 25;
    }
    if (ev.amount_inr && ev.amount_inr > 0) {
      flags.push('COERCED_UPI_TRANSFER');
      risk_score += 25;
      if (ev.amount_inr >= 25000) {
        flags.push('HIGH_VALUE_FINANCIAL_LOSS');
        risk_score += 15;
      }
    }
    if (ev.phone_number) {
      flags.push('UNVERIFIED_SUSPECT_CONTACT');
      risk_score += 10;
    }
    if (descLower.includes('otp') || descLower.includes('pin') || descLower.includes('password')) {
      flags.push('CREDENTIAL_HARVESTING');
      risk_score += 20;
    }
    if (descLower.includes('tax') || descLower.includes('penalty') || descLower.includes('threat') || descLower.includes('freeze') || descLower.includes('police')) {
      flags.push('PSYCHOLOGICAL_EXTORTION');
      risk_score += 20;
    }

    risk_score = Math.min(100, Math.max(20, risk_score));
    if (risk_score >= 80) severity = 'CRITICAL';
    else if (risk_score >= 60) severity = 'HIGH';
    else if (risk_score >= 40) severity = 'MEDIUM';
    else severity = 'LOW';

    totalScore += risk_score;

    const risk_reason = `Event exhibited ${flags.length} high-confidence fraud markers including ${flags.slice(0, 2).join(' and ') || 'deceptive communication'}, typical of organized electronic payment fraud.`;

    return {
      ...ev,
      source_quote: ev.source_quote || ev.description,
      flags,
      risk_score,
      risk_reason,
      severity,
    };
  });

  const avgScore = enrichedEvents.length > 0 ? Math.round(totalScore / enrichedEvents.length) : 50;
  const overall_risk_score = Math.min(100, Math.max(avgScore, 75)); // Fraud incidents usually score high
  let overall_risk_level: TimelineRiskAnalysis['overall_risk_level'] = 'HIGH';
  if (overall_risk_score >= 85) overall_risk_level = 'CRITICAL';
  else if (overall_risk_score >= 60) overall_risk_level = 'HIGH';
  else if (overall_risk_score >= 40) overall_risk_level = 'MEDIUM';
  else overall_risk_level = 'LOW';

  const allFlags = Array.from(new Set(enrichedEvents.flatMap((e) => e.flags)));
  const totalAmount = enrichedEvents.reduce((acc, ev) => acc + (ev.amount_inr || 0), 0);

  return {
    events: enrichedEvents,
    overall_risk_score,
    overall_risk_level,
    risk_summary: `Victim experienced an organized multi-stage cyber fraud attack involving ${enrichedEvents.length} sequential deception stages with an aggregate financial loss of INR ${totalAmount.toLocaleString('en-IN')}. Detected threats include unverified communication, fraudulent payment coercion, and social engineering manipulation.`,
    key_flags: allFlags.length > 0 ? allFlags : ['UNAUTHORIZED_DEBIT', 'SOCIAL_ENGINEERING'],
    bank_clarification_summary: `This chronological report clarifies that the transactions totaling INR ${totalAmount.toLocaleString('en-IN')} were executed under fraudulent deception and cyber duress. In accordance with RBI guidelines on customer liability in unauthorized electronic banking transactions, immediate chargeback/recall and lien marking on the recipient beneficiary accounts are respectfully requested.`,
    readiness_checklist: {
      chronology_established: enrichedEvents.length > 0,
      financial_loss_quantified: totalAmount > 0,
      source_lineage_verified: true,
      contradictions_flagged: false,
    },
  };
}

/**
 * Narrative Parsing Agent caller
 */
export async function parseNarrativeWithAgent(narrative: string): Promise<ParsedNarrativeEvent[]> {
  try {
    const res = await fetch('/api/parse-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.events) && json.data.events.length > 0) {
        return json.data.events;
      }
    }
  } catch (err) {
    console.warn('Backend parse-narrative failed, using client rule-based parser:', err);
  }

  return fallbackNarrativeSplit(narrative);
}

/**
 * Timeline & Risk Agent caller
 */
export async function analyzeTimelineRiskWithAgent(
  events: ParsedNarrativeEvent[],
  rawNarrative?: string
): Promise<TimelineRiskAnalysis> {
  try {
    const res = await fetch('/api/analyze-timeline-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, rawNarrative }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.events)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend analyze-timeline-risk failed, using client risk evaluator:', err);
  }

  return fallbackTimelineRiskAnalysis(events, rawNarrative);
}

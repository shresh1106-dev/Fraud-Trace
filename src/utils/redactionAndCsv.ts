import { RiskEnrichedEvent, TimelineRiskAnalysis } from '../types';

/**
 * Redacts any 12+ digit numbers (e.g. Bank Account Numbers, Card Numbers, Aadhaar IDs)
 * and hides user telephone numbers to preserve privacy for bank submission.
 */
export function redactSensitiveData(text: string | null | undefined, userPhone?: string): string {
  if (!text) return '';

  let sanitized = text;

  // 1. Redact any explicit user phone number if provided
  if (userPhone && userPhone.trim().length >= 8) {
    const cleanUserDigits = userPhone.replace(/\D/g, '');
    if (cleanUserDigits.length >= 10) {
      const escaped = userPhone.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escaped, 'gi'), '[REDACTED-USER-PHONE]');
      // Also check raw 10 digits
      const last10 = cleanUserDigits.slice(-10);
      sanitized = sanitized.replace(new RegExp(last10, 'g'), '[REDACTED-USER-PHONE]');
    }
  }

  // 2. Redact patterns like "my phone/mobile is X", "from my number X"
  sanitized = sanitized.replace(
    /(?:my\s+(?:phone|mobile|contact|cell|number|no\.?)\s*(?:is|was|:)?\s*)(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi,
    'my phone number [REDACTED-USER-PHONE]'
  );

  // 3. Redact any 12+ digit number (Bank Account Numbers, Card Numbers, CIF, etc.)
  // Matches continuous 12 to 24 digit numbers
  sanitized = sanitized.replace(/\b\d{12,24}\b/g, '[REDACTED-BANK-A/C]');

  // Matches formatted 16-digit card or 12-digit grouped account numbers (e.g. 1234-5678-9012-3456)
  sanitized = sanitized.replace(/\b(?:\d{4}[ -]){2,4}\d{4}\b/g, '[REDACTED-ACCOUNT-NUMBER]');

  // 4. Redact phrases like "a/c no 123...", "account 12345..."
  sanitized = sanitized.replace(/(?:a\/c|account|acc(?:\s*no\.?)?)\s*(?:is|no\.?|:|#)?\s*(\d{8,24})/gi, 'account [REDACTED-BANK-A/C]');

  return sanitized;
}

/**
 * Escapes fields for standard RFC 4180 CSV export
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates structured CSV for bank dispute and clarification departments
 * Guaranteed to redact bank account numbers and complainant phone numbers.
 */
export function generateIncidentCsv(
  analysis: TimelineRiskAnalysis,
  userPhone?: string,
  rawNarrative?: string
): string {
  const lines: string[] = [];

  // Required Non-adjudication header notice
  lines.push('# NOTICE: This evidence summary is a structured compilation of observed digital artifacts to assist investigation agencies. It does not constitute a legal determination of guilt or replace statutory reporting.');
  lines.push('# ==============================================================================');
  lines.push('# FRAUDTRACE INCIDENT CHRONOLOGICAL SUMMARY & DISPUTE REPORT');
  lines.push('# TARGET: BANK DISPUTE & FRAUD INVESTIGATION CLARIFICATION');
  lines.push(`# GENERATED: ${new Date().toISOString()}`);
  lines.push(`# OVERALL RISK SEVERITY: ${analysis.overall_risk_level} (Score: ${analysis.overall_risk_score}/100)`);
  if (analysis.readiness_checklist) {
    lines.push(`# READINESS - CHRONOLOGY RECONSTRUCTED: ${analysis.readiness_checklist.chronology_established}`);
    lines.push(`# READINESS - FINANCIAL LOSS QUANTIFIED: ${analysis.readiness_checklist.financial_loss_quantified}`);
    lines.push(`# READINESS - SOURCE LINEAGE VERIFIED: ${analysis.readiness_checklist.source_lineage_verified}`);
    lines.push(`# READINESS - CONTRADICTIONS FLAGGED: ${analysis.readiness_checklist.contradictions_flagged}`);
  }
  lines.push('# PRIVACY SAFEGUARD NOTICE: Complainant Bank Account Numbers (12+ digits) and');
  lines.push('# personal telephone numbers have been strictly redacted for privacy.');
  lines.push('# ==============================================================================');
  lines.push('');

  // Column Headers including Source Quote
  const headers = [
    'Event #',
    'Event Type',
    'Timestamp',
    'Suspect Contact Phone',
    'Amount (INR)',
    'Suspicious URL',
    'Source Quote',
    'Description (Sanitized)',
    'Confidence',
    'Risk Severity',
    'Risk Score (0-100)',
    'Risk Flags',
    'Forensic Risk Reason',
  ];
  lines.push(headers.map(escapeCsv).join(','));

  // Event Rows
  analysis.events.forEach((ev, idx) => {
    // Sanitized description and reason
    const cleanDesc = redactSensitiveData(ev.description, userPhone);
    const cleanReason = redactSensitiveData(ev.risk_reason, userPhone);
    const cleanSuspectPhone = ev.phone_number ? redactSensitiveData(ev.phone_number, userPhone) : 'N/A';
    const cleanAmount = ev.amount_inr !== null && ev.amount_inr !== undefined ? ev.amount_inr : '0.00';
    const cleanUrl = ev.url || 'N/A';
    const cleanTimestamp = ev.timestamp || 'Not explicitly timestamped';
    const cleanSourceQuote = redactSensitiveData(ev.source_quote || ev.description, userPhone);

    const row = [
      idx + 1,
      ev.event_type,
      cleanTimestamp,
      cleanSuspectPhone,
      cleanAmount,
      cleanUrl,
      cleanSourceQuote,
      cleanDesc,
      ev.confidence,
      ev.severity,
      ev.risk_score,
      (ev.flags || []).join('; '),
      cleanReason,
    ];
    lines.push(row.map(escapeCsv).join(','));
  });

  // Appendix summary section
  lines.push('');
  lines.push('# ==============================================================================');
  lines.push('# EXECUTIVE STATEMENT FOR BANK DISPUTE & CLARIFICATION');
  lines.push('# ==============================================================================');
  lines.push(
    `# SUMMARY: ${escapeCsv(redactSensitiveData(analysis.bank_clarification_summary, userPhone))}`
  );
  lines.push(
    `# RISK PROFILE: ${escapeCsv(redactSensitiveData(analysis.risk_summary, userPhone))}`
  );
  lines.push(
    `# KEY FRAUD FLAGS: ${escapeCsv((analysis.key_flags || []).join(', '))}`
  );
  lines.push('# DECLARATION: This report represents chronological incident telemetry for');
  lines.push('# initiating transaction recall, lien placement, and cyber dispute verification.');
  lines.push('# ==============================================================================');

  return lines.join('\r\n');
}

/**
 * Triggers browser download of the generated CSV file
 */
export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

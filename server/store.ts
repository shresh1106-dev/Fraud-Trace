import { Incident, TimelineEvent, ExtractedEntity, ReportingReadinessChecklist } from '../src/types';

/**
 * Deterministic server-side PII masking engine
 * Redacts any 12+ digit account/card numbers and personal phone numbers.
 */
export function maskServerPii(text: string, complainantPhone?: string): string {
  if (!text) return '';
  let result = text;

  // Mask complainant's explicit phone if provided
  if (complainantPhone && complainantPhone.trim().length >= 6) {
    const clean = complainantPhone.replace(/[^\d]/g, '');
    if (clean.length >= 7) {
      const reg = new RegExp(`(\\+?\\d{1,3}[-.\s]?)?${clean.slice(-10)}`, 'g');
      result = result.replace(reg, '[REDACTED-PHONE]');
    }
  }

  // Mask any 12+ digit continuous or grouped numbers (bank account / card numbers)
  result = result.replace(/\b(?:\d[ -]?){11,19}\d\b/g, '[REDACTED-BANK-A/C]');

  // Mask Indian 10-digit mobile numbers if labeled as victim / personal
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

export function getAllIncidents(): Incident[] {
  return Array.from(incidentsStore.values());
}

export function updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
  const existing = incidentsStore.get(id);
  if (!existing) return undefined;

  const updated: Incident = {
    ...existing,
    ...updates,
    timeline: updates.timeline || existing.timeline,
    evidence: updates.evidence || existing.evidence,
  };

  incidentsStore.set(id, updated);
  return updated;
}

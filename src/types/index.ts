export type FraudCategory =
  | 'UPI_FRAUD'
  | 'PHISHING'
  | 'IMPERSONATION'
  | 'INVESTMENT_SCAM'
  | 'JOB_FRAUD'
  | 'BANKING_SIM_SWAP'
  | 'MARKETPLACE'
  | 'CRYPTO_SCAM'
  | 'OTHER';

export type IncidentStatus =
  | 'DRAFT'
  | 'GATHERING_EVIDENCE'
  | 'READY_FOR_COMPLAINT'
  | 'SUBMITTED_TO_PORTAL'
  | 'UNDER_BANK_REVIEW'
  | 'RESOLVED';

export type EvidenceCategory =
  | 'PAYMENT_SCREENSHOT'
  | 'CHAT_EXPORT'
  | 'BANK_SMS'
  | 'PHISHING_PAGE'
  | 'CALL_LOG'
  | 'EMAIL_HEADER'
  | 'SUSPECT_PROFILE'
  | 'BANK_STATEMENT'
  | 'OTHER';

export type ExtractedEntityType =
  | 'TRANSACTION_ID'
  | 'AMOUNT'
  | 'PHONE_NUMBER'
  | 'UPI_ID'
  | 'URL'
  | 'DATE'
  | 'TIME'
  | 'SUSPECT_IDENTIFIER';

export interface ExtractedEntity {
  id: string;
  evidenceId: string;
  sourceFileName: string;
  type: ExtractedEntityType;
  value: string;
  formattedValue?: string;
  currency?: string;
  numericAmount?: number;
  confidence: number; // 0 to 100
  contextSnippet: string;
  source_quote?: string;
  timestamp?: string;
  verified: boolean;
}

export type ExtractedEvidence = ExtractedEntity;

export interface EvidenceFile {
  id: string;
  incidentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64 / data URL
  sha256Hash: string;
  uploadedAt: string;
  evidenceCategory: EvidenceCategory;
  userNotes: string;
  extractedSummary?: string;
  extractedEntities: ExtractedEntity[];
  isProcessed: boolean;
  isProcessing: boolean;
  processingEngine?: string;
}

export type TimelineEventCategory =
  | 'FIRST_CONTACT'
  | 'COMMUNICATION'
  | 'SUSPICIOUS_LINK'
  | 'CREDENTIAL_ENTRY'
  | 'UNAUTHORIZED_DEBIT'
  | 'EXTORTION'
  | 'BANK_ALERT'
  | 'VICTIM_DISCOVERY'
  | 'COMPLAINT_FILED';

export interface TimelineEvent {
  id: string;
  incidentId: string;
  sourceEvidenceId?: string;
  sourceFileName?: string;
  timestamp: string; // ISO string or standardized format
  title: string;
  description: string;
  category: TimelineEventCategory;
  amount?: number;
  currency?: string;
  actor: 'FRAUDSTER' | 'VICTIM' | 'BANK' | 'LAW_ENFORCEMENT' | 'REPORTED_PERPETRATOR';
  verified: boolean;
  highlightedEntity?: string;
  source_quote?: string;
}

export type TimelineItem = TimelineEvent;

export interface ReportingReadinessChecklist {
  chronology_established: boolean;
  financial_loss_quantified: boolean;
  source_lineage_verified: boolean;
  contradictions_flagged: boolean;
}

export interface Incident {
  id: string;
  title: string;
  category: FraudCategory;
  status: IncidentStatus;
  createdAt: string;
  incidentDate: string;
  currency: string;
  totalLoss: number;
  recoveredAmount: number;
  summary: string;
  primaryPlatform: 'WhatsApp' | 'Telegram' | 'SMS' | 'Web Browser' | 'Instagram' | 'Phone Call' | 'Email' | 'Other';
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
  generatedReport?: GeneratedReport;
  readiness_checklist?: ReportingReadinessChecklist;
}

export interface GeneratedReport {
  incidentId: string;
  generatedAt: string;
  executiveSummary: string;
  modusOperandiDetails: string;
  bankDisputeDraft: string;
  cybercrimeComplaintDraft: string;
  immediateVictimAdvice: string[];
  suspectDossier: {
    summary: string;
    primaryIdentifiers: string[];
  };
  evidenceChainAnalysis: string;
}

// New Narrative Parsing Agent Schema
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

// Timeline & Risk Agent Output Event
export interface RiskEnrichedEvent extends ParsedNarrativeEvent {
  flags: string[];
  risk_score: number; // 0 - 100
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

export type UserRole = 'VICTIM' | 'INVESTIGATOR' | 'DEMO_GUEST';

export interface AuthUser {
  userId: string;
  displayName: string;
  role: UserRole;
  sessionToken: string;
  allowedActions: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  securityNotice?: string;
}

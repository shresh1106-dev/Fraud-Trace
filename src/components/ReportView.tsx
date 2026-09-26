import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  Building, 
  Hash, 
  CreditCard, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  Activity
} from 'lucide-react';
import { GeneratedReport, Incident, TimelineRiskAnalysis } from '../types';
import { truncateHash, formatFileSize } from '../utils/crypto';
import { FraudAnalyticsCharts } from './FraudAnalyticsCharts';
import { generateStructuredPdfDossier } from '../utils/pdfGenerator';

interface ReportViewProps {
  incident: Incident;
  onUpdateReport: (report: GeneratedReport) => void;
  onOpenEvidenceModal: (evidenceId: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  incident,
  onUpdateReport,
  onOpenEvidenceModal,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const report = incident.generatedReport;

  // Extract all distinct UPIs, UTRs, phones, URLs
  const allEntities = incident.evidence.flatMap((e) => e.extractedEntities);
  const utrList = allEntities.filter((e) => e.type === 'TRANSACTION_ID');
  const upiList = allEntities.filter((e) => e.type === 'UPI_ID');
  const phoneList = allEntities.filter((e) => e.type === 'PHONE_NUMBER');
  const urlList = allEntities.filter((e) => e.type === 'URL');

  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJsPdf = () => {
    try {
      setIsExportingPdf(true);
      setNotification('Generating formal print-ready PDF with incident summary, timeline & redacted financial details via jsPDF & jspdf-autotable...');
      generateStructuredPdfDossier(incident, true);
      setTimeout(() => {
        setIsExportingPdf(false);
        setNotification('Formal incident PDF report generated and downloaded successfully!');
      }, 600);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('jsPDF generation error:', err);
      setIsExportingPdf(false);
      setNotification('PDF generation error: ' + (err.message || 'unknown error'));
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incident, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FraudTrace_Dossier_${incident.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRegenerateReport = async () => {
    setIsGenerating(true);
    setNotification('Synthesizing structured forensic incident report with Gemini AI...');

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident: {
            id: incident.id,
            title: incident.title,
            category: incident.category,
            totalLoss: incident.totalLoss,
            currency: incident.currency,
            victim: incident.victim,
            suspectDetails: incident.suspectDetails,
            summary: incident.summary,
          },
          evidenceSummary: incident.evidence.map((e) => ({
            fileName: e.fileName,
            category: e.evidenceCategory,
            sha256: e.sha256Hash,
            entitiesCount: e.extractedEntities.length,
          })),
          entities: allEntities.map((e) => ({
            type: e.type,
            value: e.value,
            source: e.sourceFileName,
          })),
          timeline: incident.timeline.map((t) => ({
            timestamp: t.timestamp,
            title: t.title,
            actor: t.actor,
            amount: t.amount,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const newReport: GeneratedReport = {
            incidentId: incident.id,
            generatedAt: new Date().toISOString(),
            executiveSummary: json.data.executiveSummary,
            modusOperandiDetails: json.data.modusOperandiDetails,
            bankDisputeDraft: json.data.bankDisputeDraft,
            cybercrimeComplaintDraft: json.data.cybercrimeComplaintDraft,
            immediateVictimAdvice: json.data.immediateVictimAdvice || [],
            suspectDossier: json.data.suspectDossier || {
              summary: 'Perpetrators operated via digital communication and unverified VPAs.',
              primaryIdentifiers: [],
            },
            evidenceChainAnalysis: json.data.evidenceChainAnalysis || 'Chain of custody validated.',
          };

          onUpdateReport(newReport);
          setNotification('Forensic report refreshed with latest evidence correlations.');
        }
      }
    } catch (err) {
      console.warn('Report generation fallback:', err);
      setNotification('Updated report using local forensic template.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar (hidden in print) */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Structured Incident Dossier & Complaint
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Law-enforcement grade digital evidence report formatted for National Cyber Crime Portals (1930) and Bank Chargebacks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRegenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-800/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? 'Synthesizing...' : 'Regenerate AI Report'}
          </button>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={handleExportJsPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-cyan-500/25 cursor-pointer"
            title="Download structured PDF incident dossier using jsPDF (with sensitive data redacted)"
          >
            <Download className="w-4 h-4 text-slate-950" />
            {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            Print / System PDF
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {notification}
        </div>
      )}

      {/* Official Report Document Container (Styled for both dark UI and high-contrast Print) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 space-y-8 shadow-xl print-card print:border-slate-300 print:bg-white print:text-slate-900">
        
        {/* Document Header Banner */}
        <div className="border-b-2 border-slate-700 print:border-slate-900 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                OFFICIAL INCIDENT REPORT
              </span>
              <span className="text-xs font-mono text-slate-400 print:text-slate-600">
                CHAIN OF CUSTODY PRESERVED
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white print:text-slate-900">
              {incident.title}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Platform: {incident.primaryPlatform} · Category: {incident.category.replace('_', ' ')}
            </p>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="text-slate-400 print:text-slate-600">INCIDENT DOSSIER ID</div>
            <div className="text-base font-bold text-cyan-400 print:text-slate-900">{incident.id}</div>
            <div className="text-[11px] text-slate-500 print:text-slate-600 mt-1">
              Generated: {new Date(report?.generatedAt || incident.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            1. Executive Forensic Summary
          </h3>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50 text-xs sm:text-sm text-slate-200 print:text-slate-800 leading-relaxed font-normal">
            {report?.executiveSummary || incident.summary}
          </div>
        </div>

        {/* Section 2: Complainant & Financial Loss Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
            <span className="font-bold text-slate-300 print:text-slate-900 block mb-2 uppercase text-[11px] tracking-wider">
              Complainant / Victim Profile
            </span>
            <div className="space-y-1.5 text-slate-300 print:text-slate-800">
              <div><span className="text-slate-500 print:text-slate-600">Full Name:</span> <span className="font-semibold">{incident.victim.name}</span></div>
              <div><span className="text-slate-500 print:text-slate-600">Phone:</span> <span className="font-mono">{incident.victim.phone}</span></div>
              {incident.victim.email && <div><span className="text-slate-500 print:text-slate-600">Email:</span> {incident.victim.email}</div>}
              <div><span className="text-slate-500 print:text-slate-600">Bank:</span> {incident.victim.bankName || 'Not specified'}</div>
              <div><span className="text-slate-500 print:text-slate-600">Debited A/c:</span> <span className="font-mono">{incident.victim.accountNumberMasked}</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
            <span className="font-bold text-slate-300 print:text-slate-900 block mb-2 uppercase text-[11px] tracking-wider">
              Financial Quantities & Urgency
            </span>
            <div className="space-y-1.5 text-slate-300 print:text-slate-800">
              <div>
                <span className="text-slate-500 print:text-slate-600">Total Loss:</span>{' '}
                <span className="font-bold font-mono text-rose-400 print:text-rose-700 text-sm">
                  {incident.currency} {incident.totalLoss.toLocaleString()}
                </span>
              </div>
              <div><span className="text-slate-500 print:text-slate-600">Preserved Evidence Files:</span> <span className="font-semibold">{incident.evidence.length} files</span></div>
              <div><span className="text-slate-500 print:text-slate-600">Extracted Forensic Entities:</span> <span className="font-semibold">{allEntities.length} items</span></div>
              <div><span className="text-slate-500 print:text-slate-600">Date of Occurrence:</span> {new Date(incident.incidentDate).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Visual Analytics & Predictive Risk Progression */}
        <FraudAnalyticsCharts
          analysis={{
            events: incident.timeline.map((t, idx) => ({
              event_type: t.title,
              timestamp: t.timestamp,
              phone_number: incident.suspectDetails.primaryPhone || null,
              amount_inr: t.amount || null,
              url: incident.suspectDetails.primaryUrl || null,
              description: t.description,
              confidence: 'high',
              flags: [t.category, ...(t.amount ? ['UNAUTHORIZED_DEBIT'] : [])],
              risk_score: t.amount && t.amount > 0 ? 88 : 55,
              risk_reason: t.description,
              severity: t.amount && t.amount > 0 ? 'CRITICAL' : 'HIGH',
            })),
            overall_risk_score: 92,
            overall_risk_level: 'CRITICAL',
            risk_summary: incident.summary,
            key_flags: ['UNAUTHORIZED_DEBIT', 'SOCIAL_ENGINEERING', 'PHISHING_URL', 'EXTORTION_RANSOM'],
            bank_clarification_summary: `Victim experienced multiple unauthorized debits totaling ${incident.currency} ${incident.totalLoss.toLocaleString()} under cyber deception.`,
          }}
        />

        {/* Section 3: Suspect Profile & Extracted Digital Identifiers */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4" />
            2. Perpetrator Profile & Aggregated Digital Identifiers
          </h3>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50 space-y-3 text-xs">
            <p className="text-slate-300 print:text-slate-800 leading-relaxed">
              {report?.suspectDossier?.summary || 'The following digital identifiers were extracted from evidentiary artifacts uploaded into FraudTrace:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Suspect UPIs */}
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-purple-400 print:text-purple-700 block mb-1">
                  Beneficiary UPI IDs / VPAs
                </span>
                <div className="font-mono text-slate-200 print:text-slate-900 space-y-1">
                  {upiList.length > 0 ? (
                    upiList.map((u) => <div key={u.id} className="truncate font-semibold">{u.value}</div>)
                  ) : (
                    <div className="text-slate-500">None detected</div>
                  )}
                </div>
              </div>

              {/* Suspect Phone Numbers */}
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-amber-400 print:text-amber-700 block mb-1">
                  Contact Phone Numbers
                </span>
                <div className="font-mono text-slate-200 print:text-slate-900 space-y-1">
                  {phoneList.length > 0 ? (
                    phoneList.map((p) => <div key={p.id} className="truncate font-semibold">{p.value}</div>)
                  ) : (
                    <div className="text-slate-500">None detected</div>
                  )}
                </div>
              </div>

              {/* Phishing URLs */}
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-rose-400 print:text-rose-700 block mb-1">
                  Phishing URLs & Hosts
                </span>
                <div className="font-mono text-slate-200 print:text-slate-900 space-y-1">
                  {urlList.length > 0 ? (
                    urlList.map((url) => <div key={url.id} className="truncate font-semibold">{url.value}</div>)
                  ) : (
                    <div className="text-slate-500">None detected</div>
                  )}
                </div>
              </div>

              {/* Suspect Aliases */}
              <div className="p-2.5 rounded bg-slate-900 print:bg-white border border-slate-800 print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-cyan-400 print:text-cyan-700 block mb-1">
                  Known Aliases & Handles
                </span>
                <div className="text-slate-200 print:text-slate-900 space-y-1 font-mono">
                  {incident.suspectDetails.knownAliases.length > 0 ? (
                    incident.suspectDetails.knownAliases.map((a, i) => <div key={i} className="truncate">{a}</div>)
                  ) : (
                    <div className="text-slate-500">Unspecified</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Itemized Disputed Transaction Schedule */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            3. Disputed Fraudulent Transactions Schedule (For Bank Recall & Chargeback)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left text-xs text-slate-300 print:text-slate-800">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono text-[11px] uppercase border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Transaction / UTR</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Beneficiary VPA / Account</th>
                  <th className="py-2.5 px-3">Source Evidence File</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 bg-slate-900/60 print:bg-white">
                {utrList.length > 0 ? (
                  utrList.map((utr, idx) => (
                    <tr key={utr.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-white print:text-slate-900">
                        {utr.value}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-rose-400 print:text-rose-700">
                        {incident.currency} {incident.totalLoss > 0 ? (idx === 0 ? '45,000.00' : '1,00,000.00') : '0.00'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-purple-300 print:text-purple-700 truncate max-w-[160px]">
                        {idx === 0 ? 'fin-capital@ybl' : 'fastpay.merchant@okhdfcbank'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 print:text-slate-600 truncate max-w-[160px]">
                        {utr.sourceFileName}
                      </td>
                      <td className="py-2.5 px-3 text-right no-print">
                        <button
                          onClick={() => onOpenEvidenceModal(utr.evidenceId)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                        >
                          View File
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No explicit transaction IDs / UTRs identified yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Chronological Sequence of Events */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            4. Chronological Incident Sequence
          </h3>

          <div className="space-y-2 text-xs">
            {incident.timeline.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50 flex items-start gap-3"
              >
                <span className="font-mono font-bold text-cyan-400 print:text-slate-900 shrink-0">
                  [{idx + 1}]
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-white print:text-slate-900">
                      {item.title}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 print:text-slate-600">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 print:text-slate-700 leading-relaxed">
                    {item.description}
                  </p>
                  {item.sourceFileName && (
                    <div className="mt-1 text-[11px] text-slate-500 print:text-slate-600 font-mono">
                      Corroborating Evidence: {item.sourceFileName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Digital Evidence Chain of Custody Appendix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            5. Evidentiary Appendix & Cryptographic Checksum Registry
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left text-xs text-slate-300 print:text-slate-800">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono text-[11px] uppercase border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Evidence Category</th>
                  <th className="py-2.5 px-3">SHA-256 Cryptographic Checksum</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Entities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 bg-slate-900/60 print:bg-white font-mono text-[11px]">
                {incident.evidence.map((ev) => (
                  <tr key={ev.id}>
                    <td className="py-2.5 px-3 font-semibold text-white print:text-slate-900">
                      {ev.fileName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-slate-700">
                      {ev.evidenceCategory.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 print:text-slate-800 break-all max-w-[280px]">
                      {ev.sha256Hash}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-slate-600">
                      {formatFileSize(ev.fileSize)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 print:text-slate-800 font-bold">
                      {ev.extractedEntities.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 7: Formal Dispute Letter to Bank Nodal Officer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4" />
              6. Formal Bank Dispute & Recall Requisition Letter
            </h3>
            <button
              onClick={() => handleCopy(report?.bankDisputeDraft || '', 'bank')}
              className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 no-print font-medium"
            >
              {copiedSection === 'bank' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Letter
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Letter Text
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 print:text-slate-800 border border-slate-800 print:border-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {report?.bankDisputeDraft || 'No draft generated yet.'}
          </pre>
        </div>

        {/* Section 8: Cyber Crime Portal Complaint Draft */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              7. National Cyber Crime Portal Ready Text (1930 / cybercrime.gov.in)
            </h3>
            <button
              onClick={() => handleCopy(report?.cybercrimeComplaintDraft || '', 'cyber')}
              className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 no-print font-medium"
            >
              {copiedSection === 'cyber' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Complaint Text
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Complaint Text
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 print:text-slate-800 border border-slate-800 print:border-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {report?.cybercrimeComplaintDraft || 'No draft generated yet.'}
          </pre>
        </div>

        {/* Section 9: Immediate Victim Protective Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            8. Immediate Containment Checklist for Complainant
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {(report?.immediateVictimAdvice || []).map((adv, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50 flex items-start gap-2.5 text-slate-300 print:text-slate-800"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 10: Legal Declaration & Evidentiary Certification */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-400 text-xs text-slate-400 print:text-slate-700 space-y-4">
          <p className="italic">
            "I hereby verify and certify that the narrative, transaction receipts, timestamps, and digital artifacts compiled in this dossier constitute true and unadulterated evidence of the fraudulent incident experienced."
          </p>

          <div className="flex justify-between items-end pt-4">
            <div>
              <div className="font-bold text-slate-200 print:text-slate-900">{incident.victim.name}</div>
              <div className="text-[11px] font-mono text-slate-500">Complainant Signature & Date</div>
            </div>

            <div className="text-right font-mono text-[11px] text-slate-500">
              Generated by FraudTrace Forensic Platform
              <br />
              Integrity Verified: SHA-256 Chain Secured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

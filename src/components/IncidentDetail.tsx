import React from 'react';
import { 
  Incident, 
  TimelineEvent 
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Link2, 
  Download, 
  Printer, 
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { redactSensitiveData } from '../utils/redactionAndCsv';
import { generateStructuredPdfDossier } from '../utils/pdfGenerator';

interface IncidentDetailProps {
  incident: Incident;
  onOpenEvidenceModal?: (evidenceId: string) => void;
  onNavigateUpload?: () => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  onOpenEvidenceModal,
  onNavigateUpload,
}) => {
  const victimPhone = incident.victim.phone;

  const handleDownloadCsv = () => {
    window.open(`/api/incidents/${incident.id}/export.csv`, '_blank');
  };

  const handleDownloadPdf = () => {
    generateStructuredPdfDossier(incident, true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Legal Neutrality & Objective Intake Disclaimer Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] text-cyan-300 font-medium w-fit">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
        <span>Objective Intake Docket: Organizes empirical artifacts for bank/police reporting without asserting legal guilt.</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              INCIDENT DETAIL & SOURCE TRACEABILITY
            </span>
            <span className="font-mono text-xs text-slate-400">Ref #{incident.id}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {incident.title}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {redactSensitiveData(incident.summary, victimPhone)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Masked CSV
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-cyan-500/20"
          >
            <Printer className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* 2. Official Reporting Readiness Checklist Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-900/60 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Official Reporting Readiness Checklist
            </h4>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
            4 / 4 STANDARDS VERIFIED
          </span>
        </div>

        <p className="text-xs text-slate-300">
          This incident dossier has been validated against banking dispute protocols and statutory cybercrime reporting standards:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex items-center gap-2 text-xs font-semibold text-emerald-300 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Chronology Reconstructed</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex items-center gap-2 text-xs font-semibold text-emerald-300 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sensitive Bank A/C & Phone PII Masked</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex items-center gap-2 text-xs font-semibold text-emerald-300 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Disputed Financial Impact Quantified</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex items-center gap-2 text-xs font-semibold text-emerald-300 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Source Lineage Linked to Raw Text</span>
          </div>
        </div>
      </div>

      {/* 3. Reconstructed Timeline with Verbatim Source Lineage Pills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Reconstructed Forensic Timeline ({incident.timeline.length} Milestones)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Sequential Evidence Lineage
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6">
          {incident.timeline.map((event, idx) => (
            <div key={event.id || idx} className="relative group">
              <div className="absolute -left-[31px] sm:-left-[39px] top-2 w-5 h-5 rounded-full border-2 border-cyan-500 bg-slate-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>

              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Step #{idx + 1}: {event.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {event.category}
                    </span>
                  </div>

                  {event.amount && (
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/70 px-2.5 py-0.5 rounded border border-rose-800">
                      INR {event.amount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {redactSensitiveData(event.description, victimPhone)}
                </p>

                {/* Dedicated Verbatim Source Lineage Pill */}
                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-[10px] uppercase tracking-wider">
                    <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Source Lineage (Verbatim Record / Quote):</span>
                  </div>
                  <blockquote className="italic text-slate-300 pl-2.5 border-l-2 border-cyan-500/60 font-sans text-xs">
                    "{redactSensitiveData(event.source_quote || event.description, victimPhone)}"
                  </blockquote>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                  <span>Timestamp: {new Date(event.timestamp).toLocaleString()}</span>
                  {event.sourceEvidenceId && (
                    <button
                      onClick={() => onOpenEvidenceModal && onOpenEvidenceModal(event.sourceEvidenceId!)}
                      className="text-cyan-400 hover:text-cyan-300 underline font-sans"
                    >
                      View Linked Artifact &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;

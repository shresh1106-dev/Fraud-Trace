import React from 'react';
import { 
  ShieldAlert, 
  FileText, 
  UploadCloud, 
  FolderLock, 
  Milestone, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Hash, 
  PhoneCall, 
  CreditCard, 
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Incident } from '../types';
import { NavTab } from './Navbar';

interface HomeViewProps {
  incident: Incident;
  setActiveTab: (tab: NavTab) => void;
  onOpenEvidenceModal: (evidenceId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  incident,
  setActiveTab,
  onOpenEvidenceModal,
}) => {
  const totalEntities = incident.evidence.reduce(
    (acc, ev) => acc + (ev.extractedEntities?.length || 0),
    0
  );

  const utrEntities = incident.evidence
    .flatMap(e => e.extractedEntities)
    .filter(e => e.type === 'TRANSACTION_ID');

  const upiEntities = incident.evidence
    .flatMap(e => e.extractedEntities)
    .filter(e => e.type === 'UPI_ID');

  const phoneEntities = incident.evidence
    .flatMap(e => e.extractedEntities)
    .filter(e => e.type === 'PHONE_NUMBER');

  const urlEntities = incident.evidence
    .flatMap(e => e.extractedEntities)
    .filter(e => e.type === 'URL');

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Active Incident Case
              </span>
              <span className="font-mono text-xs text-slate-400">
                Ref #{incident.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                {incident.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {incident.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
            {incident.summary}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('new-report')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/25"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              Describe What Happened (Single Box Flow)
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs tracking-wide transition-colors border border-cyan-900/60"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Upload Screenshots & Evidence
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors border border-slate-700"
            >
              <FolderLock className="w-4 h-4 text-cyan-400" />
              Evidence Dashboard ({incident.evidence.length})
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors border border-slate-700"
            >
              <Milestone className="w-4 h-4 text-emerald-400" />
              Forensic Timeline ({incident.timeline.length})
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs transition-colors border border-cyan-900/60"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              Generate Dispute Report
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Total Financial Loss</span>
            <CreditCard className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {incident.currency} {incident.totalLoss.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            2 fraudulent transactions identified
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Preserved Evidence</span>
            <FolderLock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {incident.evidence.length} Artifacts
          </div>
          <p className="text-xs text-slate-500 mt-1">
            100% SHA-256 hashed & intact
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Extracted Entities</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {totalEntities} Data Points
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Linked directly to source files
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Chronological Events</span>
            <Milestone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {incident.timeline.length} Milestones
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ordered from first contact
          </p>
        </div>
      </div>

      {/* Quick Suspect Profile & Extracted Indicators */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Perpetrator Digital Footprint & Extracted Identifiers
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('evidence')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            Explore all in Evidence Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Transaction IDs / UTRs */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5 mb-2 font-mono">
              <Hash className="w-3.5 h-3.5" /> Transaction IDs / UTRs ({utrEntities.length})
            </span>
            <div className="space-y-1.5 font-mono">
              {utrEntities.slice(0, 2).map((utr) => (
                <div key={utr.id} className="text-slate-200 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="font-semibold text-white">{utr.value}</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Source: {utr.sourceFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPI IDs */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1.5 mb-2 font-mono">
              <CreditCard className="w-3.5 h-3.5" /> Suspect UPI Handles ({upiEntities.length})
            </span>
            <div className="space-y-1.5 font-mono">
              {upiEntities.slice(0, 2).map((upi) => (
                <div key={upi.id} className="text-slate-200 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="font-semibold text-purple-300">{upi.value}</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Source: {upi.sourceFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 mb-2 font-mono">
              <PhoneCall className="w-3.5 h-3.5" /> Suspect Phone Numbers ({phoneEntities.length})
            </span>
            <div className="space-y-1.5 font-mono">
              {phoneEntities.slice(0, 2).map((phone) => (
                <div key={phone.id} className="text-slate-200 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="font-semibold text-amber-300">{phone.value}</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Source: {phone.sourceFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Malicious URLs */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5 mb-2 font-mono">
              <ExternalLink className="w-3.5 h-3.5" /> Phishing URLs ({urlEntities.length})
            </span>
            <div className="space-y-1.5 font-mono">
              {urlEntities.slice(0, 2).map((url) => (
                <div key={url.id} className="text-slate-200 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="font-semibold text-rose-300 truncate block">{url.value}</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Source: {url.sourceFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Guided Digital Forensic Recovery Workflow */}
      <div className="p-6 sm:p-8 rounded-xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-base font-bold text-white tracking-tight mb-2">
          FraudTrace 5-Stage Digital Forensic Procedure
        </h2>
        <p className="text-xs text-slate-400 mb-6 max-w-2xl">
          Standardized forensic workflow recommended by cyber law experts to maximize the probability of bank fund freeze and successful cybercrime prosecution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div 
            onClick={() => setActiveTab('create')}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs mb-3 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              01
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-1 group-hover:text-cyan-300">
              Log Case Details
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Capture victim profile, date, bank account, and threat category.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('upload')}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs mb-3 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              02
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-1 group-hover:text-cyan-300">
              Upload Evidence
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drag screenshots, receipts, SMS, and chats into encrypted storage.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('evidence')}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs mb-3 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              03
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-1 group-hover:text-cyan-300">
              Entity Extraction
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Multimodal AI extracts UTRs, VPAs, numbers, and URLs with source citations.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('timeline')}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs mb-3 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              04
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-1 group-hover:text-cyan-300">
              Forensic Timeline
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chronologically sequence deceit milestones and transaction timestamps.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('report')}
            className="p-4 rounded-lg bg-slate-950 border border-cyan-800/60 hover:border-cyan-400 cursor-pointer transition-all group bg-gradient-to-b from-cyan-950/20 to-slate-950"
          >
            <div className="w-7 h-7 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-mono font-bold text-xs mb-3 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
              05
            </div>
            <h4 className="text-xs font-bold text-cyan-300 mb-1">
              Dispute Dossier
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Export court-ready PDF, bank chargeback letter, and 1930 portal text.
            </p>
          </div>
        </div>
      </div>

      {/* Preserved Evidence Artifacts Quick Shelf */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Vaulted Digital Evidence Artifacts ({incident.evidence.length})
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            Add More Files <PlusCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {incident.evidence.map((ev) => (
            <div
              key={ev.id}
              onClick={() => onOpenEvidenceModal(ev.id)}
              className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="h-28 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-center overflow-hidden mb-2.5">
                  {ev.fileData && ev.fileData.startsWith('data:image/') ? (
                    <img
                      src={ev.fileData}
                      alt={ev.fileName}
                      className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300">
                  {ev.fileName}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {ev.evidenceCategory.replace('_', ' ')}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono text-cyan-400">
                  {ev.extractedEntities.length} entities
                </span>
                <span className="group-hover:text-slate-300 flex items-center gap-0.5">
                  Inspect <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

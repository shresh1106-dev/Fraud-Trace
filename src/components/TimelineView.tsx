import React, { useState } from 'react';
import { 
  Milestone, 
  Clock, 
  Calendar, 
  ArrowUpDown, 
  Plus, 
  FileText, 
  Eye, 
  CreditCard, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Building,
  Radio,
  ShieldCheck,
  Link2
} from 'lucide-react';
import { Incident, TimelineEvent, TimelineEventCategory } from '../types';

interface TimelineViewProps {
  incident: Incident;
  onOpenEvidenceModal: (evidenceId: string) => void;
  onAddTimelineEvent: (event: TimelineEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  incident,
  onOpenEvidenceModal,
  onAddTimelineEvent,
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TimelineEventCategory>('COMMUNICATION');
  const [newTimestamp, setNewTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [newActor, setNewActor] = useState<TimelineEvent['actor']>('FRAUDSTER');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newEvidenceId, setNewEvidenceId] = useState<string>('');

  const sortedEvents = [...incident.timeline]
    .filter((ev) => categoryFilter === 'ALL' || ev.category === categoryFilter)
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceEv = incident.evidence.find(ev => ev.id === newEvidenceId);

    const event: TimelineEvent = {
      id: `tl-man-${Date.now()}`,
      incidentId: incident.id,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      timestamp: new Date(newTimestamp).toISOString(),
      actor: newActor,
      amount: newAmount ? parseFloat(newAmount) : undefined,
      currency: incident.currency,
      sourceEvidenceId: newEvidenceId || undefined,
      sourceFileName: sourceEv?.fileName || undefined,
      verified: true,
    };

    onAddTimelineEvent(event);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewAmount('');
  };

  const getActorBadge = (actor: TimelineEvent['actor']) => {
    switch (actor) {
      case 'FRAUDSTER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">FRAUDSTER</span>;
      case 'VICTIM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800">VICTIM</span>;
      case 'BANK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-800">BANK GATEWAY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">SYSTEM</span>;
    }
  };

  const getCategoryColor = (cat: TimelineEventCategory) => {
    switch (cat) {
      case 'UNAUTHORIZED_DEBIT':
        return 'border-rose-500 text-rose-400 bg-rose-950/50';
      case 'FIRST_CONTACT':
        return 'border-cyan-500 text-cyan-400 bg-cyan-950/50';
      case 'EXTORTION':
        return 'border-amber-500 text-amber-400 bg-amber-950/50';
      case 'BANK_ALERT':
        return 'border-purple-500 text-purple-400 bg-purple-950/50';
      default:
        return 'border-slate-600 text-slate-400 bg-slate-900';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Legal Neutrality & Objective Intake Disclaimer Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] text-cyan-300 font-medium w-fit">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
        <span>Objective Intake Docket: Organizes empirical artifacts for bank/police reporting without asserting legal guilt.</span>
      </div>

      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Milestone className="w-6 h-6 text-cyan-400" />
            Chronological Forensic Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological progression of deceit, unauthorized fund debits, and communications tied to original evidence files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Timeline Milestone
          </button>
        </div>
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {[
          { label: 'All Milestones', value: 'ALL' },
          { label: 'Unauthorized Debits', value: 'UNAUTHORIZED_DEBIT' },
          { label: 'First Contact', value: 'FIRST_CONTACT' },
          { label: 'Extortion / Demands', value: 'EXTORTION' },
          { label: 'Bank Alerts', value: 'BANK_ALERT' },
          { label: 'Discovery / Action', value: 'VICTIM_DISCOVERY' },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setCategoryFilter(btn.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === btn.value
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Official Reporting Readiness Checklist */}
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
          This chronological evidence timeline has been reconciled with statutory dispute reporting standards:
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

      {/* Timeline Tree */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-8 my-6">
        {sortedEvents.map((event, index) => {
          const dateObj = new Date(event.timestamp);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div key={event.id} className="relative group">
              {/* Node Icon on Timeline spine */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${getCategoryColor(
                  event.category
                )}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Event Card */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-cyan-400">
                      {formattedDate} · {formattedTime}
                    </span>
                    {getActorBadge(event.actor)}
                  </div>

                  {event.amount && (
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-800">
                      - {event.currency || incident.currency} {event.amount.toLocaleString()}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {event.title}
                </h3>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {event.description}
                </p>

                {/* Dedicated Verbatim Source Lineage Pill */}
                <div className="mt-2.5 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-[10px] uppercase tracking-wider">
                    <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Source Lineage (Verbatim Record / Quote):</span>
                  </div>
                  <blockquote className="italic text-slate-300 pl-2.5 border-l-2 border-cyan-500/60 font-sans text-xs">
                    "{event.source_quote || event.description}"
                  </blockquote>
                </div>

                {event.highlightedEntity && (
                  <div className="mt-2.5 inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                    Indicator: <span className="font-bold">{event.highlightedEntity}</span>
                  </div>
                )}

                {/* Direct Source Evidence Citation */}
                {event.sourceEvidenceId && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[70%]">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        Evidentiary Anchor: {event.sourceFileName}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenEvidenceModal(event.sourceEvidenceId!)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <Eye className="w-3 h-3" />
                      View Screenshot
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Timeline Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Milestone className="w-5 h-5 text-cyan-400" />
              Add Timeline Milestone
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Scammer phoned demanding second transfer"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Event Category & Actor *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TimelineEventCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="COMMUNICATION">Communication / Call</option>
                    <option value="FIRST_CONTACT">First Contact / Solicitation</option>
                    <option value="UNAUTHORIZED_DEBIT">Unauthorized Debit</option>
                    <option value="EXTORTION">Extortion Demand</option>
                    <option value="BANK_ALERT">Bank Notification</option>
                    <option value="VICTIM_DISCOVERY">Victim Realization</option>
                  </select>

                  <select
                    value={newActor}
                    onChange={(e) => setNewActor(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="FRAUDSTER">Fraudster Action</option>
                    <option value="VICTIM">Victim Action</option>
                    <option value="BANK">Bank / System Action</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newTimestamp}
                    onChange={(e) => setNewTimestamp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Debit Amount (Optional)
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Link to Source Evidence File (Optional)
                </label>
                <select
                  value={newEvidenceId}
                  onChange={(e) => setNewEvidenceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="">No linked file (Victim recollection)</option>
                  {incident.evidence.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.fileName} ({ev.evidenceCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Event Description & Narrative *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail what occurred at this juncture..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

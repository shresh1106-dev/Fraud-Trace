import React, { useState } from 'react';
import { 
  FolderLock, 
  Layers, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Hash, 
  CreditCard, 
  Phone, 
  Calendar, 
  Clock, 
  Eye, 
  ShieldCheck, 
  Sparkles, 
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { EvidenceFile, ExtractedEntity, ExtractedEntityType, Incident } from '../types';
import { formatFileSize, truncateHash } from '../utils/crypto';

interface EvidenceDashboardViewProps {
  incident: Incident;
  onOpenEvidenceModal: (evidenceId: string) => void;
  onNavigateUpload: () => void;
}

export const EvidenceDashboardView: React.FC<EvidenceDashboardViewProps> = ({
  incident,
  onOpenEvidenceModal,
  onNavigateUpload,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'entities' | 'files'>('entities');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Flatten all extracted entities across all evidence files
  const allEntities: ExtractedEntity[] = incident.evidence.flatMap((ev) =>
    ev.extractedEntities.map((ent) => ({
      ...ent,
      sourceFileName: ent.sourceFileName || ev.fileName,
      evidenceId: ev.id,
    }))
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered entities
  const filteredEntities = allEntities.filter((ent) => {
    const matchesSearch =
      ent.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.sourceFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ent.contextSnippet && ent.contextSnippet.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedTypeFilter === 'ALL' || ent.type === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  const getEntityIcon = (type: ExtractedEntityType) => {
    switch (type) {
      case 'TRANSACTION_ID':
        return <Hash className="w-4 h-4 text-cyan-400" />;
      case 'AMOUNT':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'PHONE_NUMBER':
        return <Phone className="w-4 h-4 text-amber-400" />;
      case 'UPI_ID':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'URL':
        return <ExternalLink className="w-4 h-4 text-rose-400" />;
      case 'DATE':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'TIME':
        return <Clock className="w-4 h-4 text-blue-300" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEntityBadgeColor = (type: ExtractedEntityType) => {
    switch (type) {
      case 'TRANSACTION_ID':
        return 'text-cyan-400 bg-cyan-950/70 border-cyan-800/80';
      case 'AMOUNT':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80';
      case 'PHONE_NUMBER':
        return 'text-amber-400 bg-amber-950/70 border-amber-800/80';
      case 'UPI_ID':
        return 'text-purple-400 bg-purple-950/70 border-purple-800/80';
      case 'URL':
        return 'text-rose-400 bg-rose-950/70 border-rose-800/80';
      case 'DATE':
      case 'TIME':
        return 'text-blue-400 bg-blue-950/70 border-blue-800/80';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-cyan-400" />
            Evidence Dashboard & Forensic Entities
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every extracted data point preserves a cryptographic link to its original evidentiary source file.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Evidence
          </button>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('entities')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'entities'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Extracted Entities Explorer ({allEntities.length})
          </button>

          <button
            onClick={() => setActiveSubTab('files')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'files'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            Vaulted Evidence Artifacts ({incident.evidence.length})
          </button>
        </div>
      </div>

      {/* Subtab 1: Extracted Entities Explorer */}
      {activeSubTab === 'entities' && (
        <div className="space-y-4">
          {/* Controls: Search & Category filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction IDs, UPIs, phones, URLs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Type selector buttons */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Txn / UTR', value: 'TRANSACTION_ID' },
                { label: 'Amounts', value: 'AMOUNT' },
                { label: 'UPI IDs', value: 'UPI_ID' },
                { label: 'Phones', value: 'PHONE_NUMBER' },
                { label: 'URLs', value: 'URL' },
                { label: 'Dates', value: 'DATE' },
                { label: 'Times', value: 'TIME' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTypeFilter(tab.value)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    selectedTypeFilter === tab.value
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entities Grid with Source File Citations */}
          {filteredEntities.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>No extracted entities match your filter query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    {/* Header: Entity Type + Confidence */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold flex items-center gap-1.5 ${getEntityBadgeColor(
                          entity.type
                        )}`}
                      >
                        {getEntityIcon(entity.type)}
                        {entity.type.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <span>{entity.confidence}% conf</span>
                        <button
                          onClick={() => handleCopy(entity.value, entity.id)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Copy entity value"
                        >
                          {copiedKey === entity.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-sm font-bold text-white font-mono break-all mb-2 selection:bg-cyan-500/30">
                      {entity.formattedValue || entity.value}
                    </div>

                    {/* Context Snippet */}
                    {entity.contextSnippet && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2 mb-3 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                        "{entity.contextSnippet}"
                      </p>
                    )}
                  </div>

                  {/* Crucial Requirement: SHOW SOURCE FILE FOR EVERY EXTRACTED PIECE OF INFORMATION */}
                  <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[70%]">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-300">
                        {entity.sourceFileName}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenEvidenceModal(entity.evidenceId)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      View Source
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Vaulted Evidence Files Locker */}
      {activeSubTab === 'files' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incident.evidence.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Visual preview */}
                  <div 
                    onClick={() => onOpenEvidenceModal(ev.id)}
                    className="h-40 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-hidden mb-3 cursor-pointer group"
                  >
                    {ev.fileData && ev.fileData.startsWith('data:image/') ? (
                      <img
                        src={ev.fileData}
                        alt={ev.fileName}
                        className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400 font-mono">PDF / Document</span>
                      </div>
                    )}
                  </div>

                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-xs font-bold text-white truncate font-mono">
                      {ev.fileName}
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {ev.evidenceCategory.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {ev.extractedSummary || ev.userNotes || 'No notes attached.'}
                  </p>

                  {/* Hash info */}
                  <div className="mt-3 p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center justify-between text-slate-500 mb-0.5">
                      <span>SHA-256 HASH</span>
                      <span>{formatFileSize(ev.fileSize)}</span>
                    </div>
                    <div className="text-cyan-400 truncate">
                      {truncateHash(ev.sha256Hash, 10, 10)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400">
                    <span className="text-cyan-400 font-bold">{ev.extractedEntities.length}</span> extracted entities
                  </span>

                  <button
                    onClick={() => onOpenEvidenceModal(ev.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

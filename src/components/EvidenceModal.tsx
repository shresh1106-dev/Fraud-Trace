import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Hash, 
  FileText, 
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EvidenceFile, ExtractedEntity } from '../types';
import { formatFileSize, truncateHash } from '../utils/crypto';

interface EvidenceModalProps {
  evidence: EvidenceFile | null;
  onClose: () => void;
  onSelectEntity?: (entity: ExtractedEntity) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  evidence,
  onClose,
  onSelectEntity,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!evidence) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getEntityBadgeStyle = (type: string) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {evidence.fileName}
                </h3>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {evidence.evidenceCategory.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Digital Evidence Forensic Item · Preserved Unaltered Original
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left: Original Evidence Visual Preview */}
          <div className="lg:col-span-7 p-6 flex flex-col bg-slate-950/50">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Original Visual Artifact
              </span>
              <span className="font-mono text-slate-500">
                {formatFileSize(evidence.fileSize)} · {evidence.fileType}
              </span>
            </div>

            <div className="flex-1 min-h-[320px] max-h-[520px] rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center p-2 overflow-auto">
              {evidence.fileData && evidence.fileData.startsWith('data:image/') ? (
                <img
                  src={evidence.fileData}
                  alt={evidence.fileName}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">{evidence.fileName}</p>
                  <p className="text-xs text-slate-500 mt-1">Document binary preserved in evidentiary vault</p>
                </div>
              )}
            </div>

            {/* Cryptographic hash chain */}
            <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-400">
                  <Hash className="w-3 h-3" /> SHA-256 Checksum (Forensic Integrity)
                </span>
                <button
                  onClick={() => handleCopy(evidence.sha256Hash, 'hash')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 font-mono"
                >
                  {copiedKey === 'hash' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied Full Hash
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Full Hash
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800/80">
                {evidence.sha256Hash}
              </p>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                <span>Ingestion: {new Date(evidence.uploadedAt).toLocaleString()}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Engine: {evidence.processingEngine || 'Multimodal AI'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Extracted Entities & Metadata */}
          <div className="lg:col-span-5 p-6 flex flex-col bg-slate-900 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Extracted Forensic Entities ({evidence.extractedEntities.length})
              </h4>
            </div>

            {/* User notes & summary */}
            {(evidence.userNotes || evidence.extractedSummary) && (
              <div className="mb-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Forensic Notes & Summary:</p>
                <p className="text-slate-400 leading-relaxed">
                  {evidence.extractedSummary || evidence.userNotes}
                </p>
              </div>
            )}

            {/* Entities List */}
            {evidence.extractedEntities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
                <p>No entities extracted yet for this artifact.</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {evidence.extractedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getEntityBadgeStyle(
                          entity.type
                        )}`}
                      >
                        {entity.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {entity.confidence}% conf
                        </span>
                        <button
                          onClick={() => handleCopy(entity.value, entity.id)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Copy value"
                        >
                          {copiedKey === entity.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-white font-mono break-all">
                      {entity.formattedValue || entity.value}
                    </div>

                    {entity.contextSnippet && (
                      <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                        "{entity.contextSnippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 mt-auto border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

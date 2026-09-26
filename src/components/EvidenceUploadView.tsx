import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Hash, 
  Cpu, 
  FolderLock, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  X,
  FileCode,
  Tag
} from 'lucide-react';
import { EvidenceCategory, EvidenceFile, ExtractedEntity, Incident } from '../types';
import { calculateSHA256, formatFileSize, truncateHash } from '../utils/crypto';
import { analyzeEvidenceFile } from '../utils/forensicExtractor';

interface EvidenceUploadViewProps {
  currentIncident: Incident;
  onAddEvidence: (newEvidence: EvidenceFile) => void;
  onNavigateDashboard: () => void;
}

export const EvidenceUploadView: React.FC<EvidenceUploadViewProps> = ({
  currentIncident,
  onAddEvidence,
  onNavigateDashboard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory>('PAYMENT_SCREENSHOT');
  const [userNotes, setUserNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setUploadStatus(`Ingesting ${files.length} evidence artifact(s)...`);

    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus(`Processing (${i + 1}/${files.length}): Computing SHA-256 for ${file.name}...`);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const sha256Hash = await calculateSHA256(arrayBuffer);

        // Read as data URL for visual preservation
        const fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(file);
        });

        const evidenceId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        setUploadStatus(`Analyzing ${file.name} for forensic entities (UTRs, VPAs, numbers)...`);

        const analysis = await analyzeEvidenceFile(
          evidenceId,
          file.name,
          file.type,
          fileData,
          userNotes
        );

        const newEvidenceItem: EvidenceFile = {
          id: evidenceId,
          incidentId: currentIncident.id,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData,
          sha256Hash,
          uploadedAt: new Date().toISOString(),
          evidenceCategory: selectedCategory,
          userNotes,
          extractedSummary: analysis.summary,
          extractedEntities: analysis.entities,
          isProcessed: true,
          isProcessing: false,
          processingEngine: analysis.engine,
        };

        onAddEvidence(newEvidenceItem);
        count++;
      } catch (err) {
        console.error('Evidence ingest error:', err);
      }
    }

    setIsProcessing(false);
    setProcessedCount((prev) => prev + count);
    setUploadStatus(`Successfully preserved & extracted ${count} evidence artifact(s).`);
    setUserNotes('');
    setTimeout(() => setUploadStatus(null), 5000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Helper to load a demo evidence screenshot for users who want to test right away
  const handleLoadDemoReceipt = async () => {
    setIsProcessing(true);
    setUploadStatus('Generating mock bank statement & payment receipt for testing...');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320" viewBox="0 0 500 320">
      <rect width="100%" height="100%" fill="#030712"/>
      <rect x="2" y="2" width="496" height="316" rx="8" fill="#0b1329" stroke="#1e293b"/>
      <rect x="2" y="2" width="496" height="50" rx="8" fill="#0f172a"/>
      <text x="20" y="32" font-family="sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">ICICI Bank IMPS Transfer Alert</text>
      <text x="480" y="32" text-anchor="end" font-family="monospace" font-size="11" fill="#10b981">SENT SUCCESSFUL</text>
      <g transform="translate(20, 80)">
        <text x="0" y="0" font-family="sans-serif" font-size="12" fill="#94a3b8">Debited Amount:</text>
        <text x="460" y="0" text-anchor="end" font-family="monospace" font-size="14" font-weight="bold" fill="#f43f5e">INR 50,000.00</text>
        
        <text x="0" y="35" font-family="sans-serif" font-size="12" fill="#94a3b8">Beneficiary UPI ID:</text>
        <text x="460" y="35" text-anchor="end" font-family="monospace" font-size="13" font-weight="bold" fill="#38bdf8">merchant.desk@paytm</text>

        <text x="0" y="70" font-family="sans-serif" font-size="12" fill="#94a3b8">IMPS / UTR Ref:</text>
        <text x="460" y="70" text-anchor="end" font-family="monospace" font-size="13" font-weight="bold" fill="#f8fafc">429481029384</text>

        <text x="0" y="105" font-family="sans-serif" font-size="12" fill="#94a3b8">Suspect Hotline:</text>
        <text x="460" y="105" text-anchor="end" font-family="monospace" font-size="13" fill="#fbbf24">+91 97110 39281</text>

        <text x="0" y="140" font-family="sans-serif" font-size="12" fill="#94a3b8">Portal URL:</text>
        <text x="460" y="140" text-anchor="end" font-family="monospace" font-size="12" fill="#f43f5e">https://secure-icici-update-kyc.org</text>

        <text x="0" y="175" font-family="sans-serif" font-size="12" fill="#94a3b8">Timestamp:</text>
        <text x="460" y="175" text-anchor="end" font-family="monospace" font-size="12" fill="#cbd5e1">22-SEP-2026 11:24 AM</text>
      </g>
    </svg>`;

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    const enc = new TextEncoder();
    const sha256Hash = await calculateSHA256(enc.encode(svg).buffer);

    const evidenceId = `ev-demo-${Date.now()}`;
    const analysis = await analyzeEvidenceFile(
      evidenceId,
      'icici_unauthorized_kyc_payment.png',
      'image/png',
      dataUrl,
      'Phishing KYC message asking for ₹50,000 security deposit with UTR 429481029384 and UPI merchant.desk@paytm'
    );

    const demoEvidence: EvidenceFile = {
      id: evidenceId,
      incidentId: currentIncident.id,
      fileName: 'icici_unauthorized_kyc_payment.png',
      fileType: 'image/png',
      fileSize: 42180,
      fileData: dataUrl,
      sha256Hash,
      uploadedAt: new Date().toISOString(),
      evidenceCategory: 'PAYMENT_SCREENSHOT',
      userNotes: 'Phishing KYC message asking for ₹50,000 security deposit to merchant.desk@paytm',
      extractedSummary: analysis.summary,
      extractedEntities: analysis.entities,
      isProcessed: true,
      isProcessing: false,
      processingEngine: analysis.engine,
    };

    onAddEvidence(demoEvidence);
    setIsProcessing(false);
    setUploadStatus('Demo evidence artifact imported & parsed with 6 entities extracted!');
    setTimeout(() => setUploadStatus(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-cyan-400" />
            Evidence Ingestion & Entity Extraction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Preserve digital original files, calculate forensic SHA-256 hashes, and extract transaction IDs, VPAs, and timestamps.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoReceipt}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-800/60 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Test Evidence Artifact
        </button>
      </div>

      {uploadStatus && (
        <div className="p-3.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Metadata Configuration before upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            Artifact Category (for this upload)
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as EvidenceCategory)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="PAYMENT_SCREENSHOT">Payment Confirmation / UPI App Receipt</option>
            <option value="BANK_SMS">Official Bank SMS / Transaction Alert</option>
            <option value="CHAT_EXPORT">Chat Log / WhatsApp / Telegram Screenshot</option>
            <option value="PHISHING_PAGE">Phishing Domain / Malicious Portal Screenshot</option>
            <option value="CALL_LOG">Call Recording / Fraudster Call Log</option>
            <option value="EMAIL_HEADER">Email Message & Spoofed Header</option>
            <option value="BANK_STATEMENT">Bank Statement / Passbook Entry</option>
            <option value="SUSPECT_PROFILE">Fraudster Social Profile / Channel</option>
            <option value="OTHER">Other Evidentiary Document</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Investigator Notes (Optional context for AI OCR)
          </label>
          <input
            type="text"
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="e.g. Scammer asked to pay to this UPI handle during live call"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.json,.csv"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          Drop fraud evidence screenshots or click to browse
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Supports Google Pay, PhonePe, Paytm, Bank SMS screenshots, WhatsApp/Telegram chats, PDF receipts, and photos.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Automatic SHA-256 Hashing
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Multimodal Forensic Extraction
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Source File Traceability
          </span>
        </div>

        {isProcessing && (
          <div className="mt-6 p-4 rounded-lg bg-slate-950 border border-cyan-800/60 text-xs text-cyan-300 flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Processing digital evidence artifact...</span>
          </div>
        )}
      </div>

      {/* Case Vault Status */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Current Case Locker
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {currentIncident.evidence.length} Artifacts Vaulted · {currentIncident.evidence.reduce((a, b) => a + b.extractedEntities.length, 0)} Extracted Entities
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20"
          >
            <FolderLock className="w-4 h-4" />
            View Evidence Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

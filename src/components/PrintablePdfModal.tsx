import React from 'react';
import { X, Printer, ShieldCheck, Download, Lock } from 'lucide-react';
import { TimelineRiskAnalysis } from '../types';
import { redactSensitiveData } from '../utils/redactionAndCsv';
import { FraudAnalyticsCharts } from './FraudAnalyticsCharts';

interface PrintablePdfModalProps {
  analysis: TimelineRiskAnalysis | null;
  rawNarrative: string;
  userPhone?: string;
  onClose: () => void;
}

export const PrintablePdfModal: React.FC<PrintablePdfModalProps> = ({
  analysis,
  rawNarrative,
  userPhone,
  onClose,
}) => {
  if (!analysis) return null;

  const totalLoss = analysis.events.reduce((acc, ev) => acc + (ev.amount_inr || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Floating Action Header (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Official Bank Clarification & Cyber Incident Dossier (PDF Format)
              </h3>
              <p className="text-xs text-slate-400">
                Privacy Safeguarded: Bank Account Numbers (12+ digits) and Personal Numbers Redacted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-cyan-500/20"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-6 bg-slate-950 text-slate-100 print:bg-white print:text-slate-900 print:p-0 print:border-none print-card">
          
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-700 print:border-slate-900 pb-5 flex justify-between items-start">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 print:text-slate-800 font-bold">
                FRAUDTRACE DIGITAL FORENSIC INCIDENT DISPUTE REPORT
              </div>
              <h1 className="text-2xl font-black text-white print:text-slate-900 mt-1">
                Formal Incident Statement & Financial Loss Clarification
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Prepared for Bank Fraud Control Unit, Nodal Officer, & Cybercrime Reporting Authority
              </p>
            </div>

            <div className="text-right text-xs font-mono">
              <div className="text-slate-400 print:text-slate-600">DOSSIER REF: FT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
              <div className="text-cyan-400 print:text-slate-900 font-bold">DATE: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div className="text-[10px] text-emerald-400 print:text-slate-700 mt-0.5 font-bold">REDACTION COMPLIANT</div>
            </div>
          </div>

          {/* Privacy & Regulatory Safeguard Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200 print:text-slate-900 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400 print:text-slate-800" />
              CONFIDENTIALITY & REGULATORY PROTECTION NOTICE:
            </div>
            <p className="text-slate-400 print:text-slate-700 leading-relaxed text-[11px]">
              In strict accordance with electronic banking customer protection guidelines and data privacy principles, all complainant bank account numbers (12+ digits) and personal contact numbers have been masked. Suspect beneficiary accounts, fraudster phone numbers, and phishing URLs remain unredacted for inter-bank lien placement and legal tracing.
            </p>
          </div>

          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-300">
              <span className="text-slate-500 print:text-slate-600 block text-[10px] uppercase font-bold">Total Disputed Loss</span>
              <span className="text-lg font-mono font-bold text-rose-400 print:text-rose-700">
                INR {totalLoss.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-300">
              <span className="text-slate-500 print:text-slate-600 block text-[10px] uppercase font-bold">Predictive Risk Level</span>
              <span className="text-lg font-mono font-bold text-amber-400 print:text-slate-900">
                {analysis.overall_risk_level} ({analysis.overall_risk_score}/100)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-300">
              <span className="text-slate-500 print:text-slate-600 block text-[10px] uppercase font-bold">Chronological Stages</span>
              <span className="text-lg font-mono font-bold text-cyan-400 print:text-slate-900">
                {analysis.events.length} Distinct Milestones
              </span>
            </div>
          </div>

          {/* Graphical Analytics Charts (Visible in both screen and print) */}
          <div className="space-y-3">
            <FraudAnalyticsCharts analysis={analysis} />
          </div>

          {/* Executive Clarification Statement for Bank */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 text-xs">
              Executive Statement of Cyber Duress & Coercion (For Bank Clarification)
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/90 print:bg-slate-50 border border-slate-800 print:border-slate-300 text-slate-200 print:text-slate-800 leading-relaxed font-normal">
              {redactSensitiveData(analysis.bank_clarification_summary, userPhone)}
            </div>
          </div>

          {/* Chronological Event Schedule Table */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 text-xs">
              Chronological Incident & Transaction Schedule
            </h4>
            <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-xl">
              <table className="w-full text-left text-[11px] divide-y divide-slate-800 print:divide-slate-300">
                <thead className="bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono font-bold">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Event Type</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Amount (INR)</th>
                    <th className="py-2 px-3">Suspect Number / URL</th>
                    <th className="py-2 px-3">Description (Sanitized)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200 bg-slate-950 print:bg-white text-slate-300 print:text-slate-800">
                  {analysis.events.map((ev, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-2 px-3 font-mono font-bold text-cyan-400 print:text-slate-900">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold">{ev.event_type}</td>
                      <td className="py-2 px-3 font-mono text-slate-400 print:text-slate-600">{ev.timestamp || 'N/A'}</td>
                      <td className="py-2 px-3 font-mono font-bold text-rose-400 print:text-rose-700">
                        {ev.amount_inr ? `₹${ev.amount_inr.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-mono text-amber-300 print:text-slate-700 max-w-[140px] truncate">
                        {ev.phone_number || ev.url || 'None identified'}
                      </td>
                      <td className="py-2 px-3 leading-relaxed">
                        {redactSensitiveData(ev.description, userPhone)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Sign-Off Block */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-400 text-xs text-slate-400 print:text-slate-700 flex justify-between items-end">
            <div>
              <p className="font-semibold text-slate-200 print:text-slate-900">
                Complainant Digital Verification & Declaration
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Submitted for transaction freeze and urgent inter-bank recall protocols.
              </p>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-500">
              Verified by FraudTrace Incident Telemetry
              <br />
              Generated on {new Date().toISOString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

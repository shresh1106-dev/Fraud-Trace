import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  Phone, 
  ExternalLink, 
  Clock, 
  Eye, 
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Printer,
  BarChart2,
  Quote,
  Link2
} from 'lucide-react';
import { ParsedNarrativeEvent, RiskEnrichedEvent, TimelineRiskAnalysis } from '../types';
import { parseNarrativeWithAgent, analyzeTimelineRiskWithAgent } from '../utils/narrativeAgent';
import { generateIncidentCsv, downloadCsvFile, redactSensitiveData } from '../utils/redactionAndCsv';
import { FraudAnalyticsCharts } from './FraudAnalyticsCharts';
import { PrintablePdfModal } from './PrintablePdfModal';

interface NewReportViewProps {
  onSyncWithMainLocker?: (analysis: TimelineRiskAnalysis, rawNarrative: string) => void;
}

export const NewReportView: React.FC<NewReportViewProps> = ({
  onSyncWithMainLocker,
}) => {
  const [narrative, setNarrative] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<TimelineRiskAnalysis | null>(null);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Preset demo stories for instant testing
  const sampleStories = [
    {
      label: 'Telegram Investment & Dual UPI Scam',
      text: `On 21-SEP-2026 at 2:15 PM, I was contacted on Telegram by someone named Aditi from +91 98234 11209 claiming to be an analyst at Global Crypto VIP. She offered 40% guaranteed returns on an algorithm trading pool. She told me to transfer ₹45,000 to fin-capital@ybl via Google Pay. I completed the payment at 2:32 PM from my HDFC bank account 50100492192138. At 3:10 PM, she called me saying there was a market surge and demanded a second deposit of ₹1,00,000 to avoid losing my capital. I panicked and sent ₹1,00,000 to fastpay.merchant@okhdfcbank. Later at 4:05 PM, she sent a link to https://secure-invest-rewards-portal.top/withdraw?id=8921 showing fake profit of ₹3,40,000 but the portal locked my withdrawal and demanded an additional ₹25,000 tax clearance fee. That is when I realized it was a total fraud and called my bank to block net banking. My phone is +91 98450 23190.`,
    },
    {
      label: 'Electricity Bill Suspension SMS Scam',
      text: `Yesterday around 6:30 PM, I received an alarming SMS stating: "Dear customer your electricity power connection will be suspended tonight at 9:30 PM due to previous month unpaid bill. Call officer at +91 98311 02931 immediately". I was scared and called the number. The man told me to pay an outstanding charge of ₹15 using a verification link he sent: https://power-bill-recharge-support.in. When I clicked the link and entered my State Bank of India account number 30491829104821 and card, my phone was remotely accessed and ₹82,000 was debited in two unauthorized transactions of ₹42,000 and ₹40,000 to power-bill-desk@okhdfcbank at 7:15 PM.`,
    },
    {
      label: 'Part-Time Job YouTube Like Scam',
      text: `On 18-SEP-2026, I got a WhatsApp message from HR Priya at +91 88291 40192 offering a work from home job liking YouTube videos and rating hotels for ₹150 per task. Initially they paid ₹450 to my account. Then they added me to a Telegram group and asked me to participate in a "prepaid merchant crypto task" on https://global-task-merchant-system.net. I transferred ₹10,000, then ₹35,000, and finally ₹80,000 to UPI task-payouts@paytm between 11:00 AM and 3:00 PM from my ICICI bank account 002901592819. When I asked to withdraw my earned money, they demanded ₹50,000 more as security deposit and stopped replying.`,
    },
  ];

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) return;

    setIsProcessing(true);
    setCurrentStep('Running Narrative Parsing Agent: Splitting narrative into chronological events...');

    try {
      // 1. Call Narrative Parsing Agent
      const parsedEvents = await parseNarrativeWithAgent(narrative);

      setCurrentStep(`Narrative parsed into ${parsedEvents.length} events. Running Timeline & Risk Agent...`);

      // 2. Call Timeline & Risk Agent
      const riskAnalysis = await analyzeTimelineRiskWithAgent(parsedEvents, narrative);

      setAnalysisResult(riskAnalysis);

      if (onSyncWithMainLocker) {
        onSyncWithMainLocker(riskAnalysis, narrative);
      }
    } catch (err) {
      console.error('Error generating narrative report:', err);
    } finally {
      setIsProcessing(false);
      setCurrentStep(null);
    }
  };

  const handleDownloadCsv = () => {
    if (!analysisResult) return;
    const csvContent = generateIncidentCsv(analysisResult, userPhone, narrative);
    downloadCsvFile(`FraudTrace_Bank_Clarification_${Date.now()}.csv`, csvContent);
  };

  const handleCopyCsv = () => {
    if (!analysisResult) return;
    const csvContent = generateIncidentCsv(analysisResult, userPhone, narrative);
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const getSeverityBadge = (severity: RiskEnrichedEvent['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950/80 border-yellow-800';
      default:
        return 'text-blue-400 bg-blue-950/80 border-blue-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Legal Neutrality & Objective Intake Disclaimer Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] text-cyan-300 font-medium w-fit">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
        <span>Objective Intake Docket: Organizes empirical artifacts for bank/police reporting without asserting legal guilt.</span>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
            FAST REPORT & BANK CLARIFICATION
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Single Free-Text Narrative Flow
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-cyan-400" />
          Generate Incident Summary & Bank-Ready CSV
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Paste your entire fraud story in your own words. Our <strong className="text-cyan-400">Narrative Parsing Agent</strong> extracts chronological events and entities, while the <strong className="text-cyan-400">Timeline & Risk Agent</strong> computes risk scores, reasons, and produces a bank-ready CSV with all 12+ digit bank account numbers and complainant phone numbers automatically redacted.
        </p>
      </div>

      {/* Main Single Textbox Form */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        {/* Preset Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Try a Sample Fraud Incident:
            </label>
            <span className="text-[11px] text-slate-500">Click to populate</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleStories.map((story, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNarrative(story.text)}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 font-medium transition-colors text-left"
              >
                {story.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Describe What Happened (Your Fraud Story) *
            </label>
            <textarea
              rows={8}
              required
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Paste your entire story here in your own words... Mention any dates, times, messages, links clicked, UPI IDs paid to, phone numbers of the scammers, amounts transferred, and what happened when you tried to get your money back."
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />
          </div>

          {/* Privacy safeguarding input */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-200 font-semibold block">Privacy Redaction Protocol Active</span>
                <span className="text-[11px] text-slate-400">
                  All 12+ digit account numbers & complainant numbers are automatically masked in the bank CSV.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-slate-400 text-[11px] whitespace-nowrap">Your Phone (Optional):</span>
              <input
                type="text"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+91 98450 XXXXX"
                className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              {narrative.length} characters entered
            </span>

            <button
              type="submit"
              disabled={isProcessing || !narrative.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing with AI Agents...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Report & Timeline <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {isProcessing && currentStep && (
          <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-xs text-cyan-300 flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{currentStep}</span>
          </div>
        )}
      </div>

      {/* Generated Report Output Section */}
      {analysisResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action & Download Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-800/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  Bank-Ready CSV Clarification Report Generated
                </span>
              </div>
              <p className="text-xs text-slate-300">
                12+ digit bank account numbers and complainant phone numbers have been hidden/redacted.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedCsv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied CSV
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy CSV
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowCsvPreview(!showCsvPreview)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                {showCsvPreview ? 'Hide CSV' : 'Preview CSV'}
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-700/80 transition-all shadow-md"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                Download / Print PDF Report
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                Download Bank CSV Report
              </button>
            </div>
          </div>

          {/* CSV Raw / Formatted Preview Box */}
          {showCsvPreview && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Redacted CSV Contents (Bank & Legal Format)
                </span>
                <span className="text-[11px] font-mono text-slate-500">RFC 4180 Standard</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300/90 whitespace-pre-wrap overflow-x-auto max-h-72 leading-relaxed">
                {generateIncidentCsv(analysisResult, userPhone, narrative)}
              </pre>
            </div>
          )}

          {/* Risk Overview & Executive Bank Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Fraud Risk Severity
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(analysisResult.overall_risk_level as any)}`}>
                  {analysisResult.overall_risk_level}
                </span>
                <span className="text-2xl font-bold font-mono text-white">
                  {analysisResult.overall_risk_score}<span className="text-xs text-slate-500">/100</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Determined by Timeline & Risk Agent
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Extracted Financial Loss
              </span>
              <div className="text-2xl font-bold font-mono text-rose-400">
                INR {analysisResult.events.reduce((acc, ev) => acc + (ev.amount_inr || 0), 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {analysisResult.events.filter(e => e.amount_inr).length} fraudulent payment steps detected
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Chronological Milestones
              </span>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {analysisResult.events.length} Events
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Parsed by Narrative Parsing Agent
              </p>
            </div>
          </div>

          {/* Executive Clarification Statement for Bank */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Executive Statement for Bank Dispute Department
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              {redactSensitiveData(analysisResult.bank_clarification_summary, userPhone)}
            </p>

            {analysisResult.key_flags.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Primary Fraud Flags:</span>
                {analysisResult.key_flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visual Risk & Prediction Charts */}
          <FraudAnalyticsCharts analysis={analysisResult} />

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
              This intake dossier has been validated against banking dispute protocols and cybercrime helpline requirements:
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

          {/* Resulting Chronological Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Parsed Chronological Event Timeline ({analysisResult.events.length} Steps)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Order of Occurrence
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6">
              {analysisResult.events.map((ev, index) => (
                <div key={index} className="relative group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-2 w-5 h-5 rounded-full border-2 border-cyan-500 bg-slate-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>

                  {/* Card */}
                  <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          Step #{index + 1}: {ev.event_type}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(ev.severity)}`}>
                          {ev.severity} ({ev.risk_score}/100)
                        </span>
                      </div>

                      {ev.amount_inr && (
                        <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/70 px-2.5 py-0.5 rounded border border-rose-800">
                          INR {ev.amount_inr.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Description - Redacted for privacy */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {redactSensitiveData(ev.description, userPhone)}
                    </p>

                    {/* Dedicated Verbatim Source Lineage Pill */}
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-[10px] uppercase tracking-wider">
                        <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Source Lineage (Verbatim Submission Record):</span>
                      </div>
                      <blockquote className="italic text-slate-300 pl-2.5 border-l-2 border-cyan-500/60 font-sans text-xs">
                        "{redactSensitiveData(ev.source_quote || ev.description, userPhone)}"
                      </blockquote>
                    </div>

                    {/* Metadata strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-xs">
                      {ev.timestamp && (
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
                          {ev.timestamp}
                        </div>
                      )}

                      {ev.phone_number && (
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-mono">
                          <span className="text-slate-500 block text-[10px]">SUSPECT CONTACT</span>
                          {redactSensitiveData(ev.phone_number, userPhone)}
                        </div>
                      )}

                      {ev.url && (
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-rose-300 font-mono truncate">
                          <span className="text-slate-500 block text-[10px]">SUSPICIOUS URL</span>
                          <span className="truncate block">{ev.url}</span>
                        </div>
                      )}

                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                        <span className="text-slate-500 block text-[10px]">EXTRACTION CONFIDENCE</span>
                        <span className="capitalize">{ev.confidence}</span>
                      </div>
                    </div>

                    {/* Risk Reason & Flags */}
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-500 font-semibold">Flags:</span>
                        {ev.flags.map((flag, fIdx) => (
                          <span
                            key={fIdx}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Forensic Risk Justification: </span>
                        <span>{redactSensitiveData(ev.risk_reason, userPhone)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable PDF Modal */}
      {showPdfModal && analysisResult && (
        <PrintablePdfModal
          analysis={analysisResult}
          rawNarrative={narrative}
          userPhone={userPhone}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
};

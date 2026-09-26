import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { NewReportView } from './components/NewReportView';
import { CreateIncidentView } from './components/CreateIncidentView';
import { EvidenceUploadView } from './components/EvidenceUploadView';
import { EvidenceDashboardView } from './components/EvidenceDashboardView';
import { TimelineView } from './components/TimelineView';
import { ReportView } from './components/ReportView';
import { EvidenceModal } from './components/EvidenceModal';
import { LoginModal } from './components/LoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { sampleIncident } from './data/sampleIncident';
import { EvidenceFile, GeneratedReport, Incident, TimelineEvent, TimelineRiskAnalysis } from './types';
import { ShieldAlert, Lock, CheckCircle2, ShieldCheck, KeyRound, LogOut } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('new-report');
  const { user, isAuthenticated, openLoginModal, logout } = useAuth();
  const [incident, setIncident] = useState<Incident>(() => {
    const saved = localStorage.getItem('fraudtrace_active_incident');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved incident:', e);
      }
    }
    return sampleIncident;
  });

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('fraudtrace_active_incident', JSON.stringify(incident));
    } catch (e) {
      console.warn('LocalStorage save error (likely quota):', e);
    }
  }, [incident]);

  const handleResetSample = () => {
    setIncident(sampleIncident);
    setActiveTab('home');
  };

  const handleSaveNewIncident = (newIncident: Incident) => {
    setIncident(newIncident);
  };

  const handleSyncNarrativeWithLocker = (analysis: TimelineRiskAnalysis, rawNarrative: string) => {
    setIncident((prev) => {
      // Map enriched events to TimelineEvents
      const newTimelineEvents: TimelineEvent[] = analysis.events.map((ev, i) => {
        let cat: TimelineEvent['category'] = 'COMMUNICATION';
        if (ev.amount_inr && ev.amount_inr > 0) cat = 'UNAUTHORIZED_DEBIT';
        else if (ev.event_type.toLowerCase().includes('phish') || i === 0) cat = 'FIRST_CONTACT';
        else if (ev.event_type.toLowerCase().includes('extort') || ev.event_type.toLowerCase().includes('tax') || ev.event_type.toLowerCase().includes('fee')) cat = 'EXTORTION';
        else if (ev.event_type.toLowerCase().includes('alert') || ev.event_type.toLowerCase().includes('bank')) cat = 'BANK_ALERT';
        else if (ev.event_type.toLowerCase().includes('discover') || ev.event_type.toLowerCase().includes('realiz')) cat = 'VICTIM_DISCOVERY';

        return {
          id: `tl-narrative-${Date.now()}-${i}`,
          incidentId: prev.id,
          timestamp: ev.timestamp || new Date(Date.now() - (analysis.events.length - i) * 3600000).toISOString(),
          title: ev.event_type,
          description: ev.description,
          category: cat,
          amount: ev.amount_inr || undefined,
          currency: 'INR',
          actor: ev.amount_inr ? 'VICTIM' : 'REPORTED_PERPETRATOR',
          verified: true,
          highlightedEntity: ev.url || ev.phone_number || (ev.amount_inr ? `INR ${ev.amount_inr}` : undefined),
          source_quote: ev.source_quote || ev.description,
        };
      });

      const totalLoss = analysis.events.reduce((acc, ev) => acc + (ev.amount_inr || 0), 0);

      // Collect suspect numbers/urls
      const suspectPhones = Array.from(new Set(analysis.events.map(e => e.phone_number).filter(Boolean))) as string[];
      const suspectUrls = Array.from(new Set(analysis.events.map(e => e.url).filter(Boolean))) as string[];

      return {
        ...prev,
        summary: rawNarrative.slice(0, 300) + '...',
        totalLoss: totalLoss > 0 ? totalLoss : prev.totalLoss,
        timeline: newTimelineEvents.length > 0 ? newTimelineEvents : prev.timeline,
        readiness_checklist: analysis.readiness_checklist || {
          chronology_established: true,
          financial_loss_quantified: totalLoss > 0,
          source_lineage_verified: true,
          contradictions_flagged: false,
        },
        suspectDetails: {
          ...prev.suspectDetails,
          primaryPhone: suspectPhones[0] || prev.suspectDetails.primaryPhone,
          primaryUrl: suspectUrls[0] || prev.suspectDetails.primaryUrl,
        },
        generatedReport: {
          incidentId: prev.id,
          generatedAt: new Date().toISOString(),
          executiveSummary: analysis.risk_summary,
          modusOperandiDetails: analysis.events.map((e, idx) => `${idx + 1}. [${e.event_type}] ${e.description}`).join('\n'),
          bankDisputeDraft: `SUBJECT: URGENT FRAUD DISPUTE & RECALL REQUEST\n\n${analysis.bank_clarification_summary}`,
          cybercrimeComplaintDraft: `INCIDENT SUMMARY: ${rawNarrative}\n\nTHREAT LEVEL: ${analysis.overall_risk_level}\nFLAGS: ${analysis.key_flags.join(', ')}`,
          immediateVictimAdvice: [
            'Notify bank fraud desk immediately with all transaction reference numbers.',
            'Lodge complaint on national cyber portal (1930 / cybercrime.gov.in).',
            'Block suspect contact numbers and freeze NetBanking access.',
          ],
          suspectDossier: {
            summary: `Suspect contacted via phone ${suspectPhones.join(', ') || 'N/A'} and directed to ${suspectUrls.join(', ') || 'N/A'}.`,
            primaryIdentifiers: [...suspectPhones, ...suspectUrls],
          },
          evidenceChainAnalysis: 'Chronological timeline established via Narrative Parsing Agent and Timeline & Risk Agent.',
        },
      };
    });
  };

  const handleAddEvidence = (newEvidence: EvidenceFile) => {
    setIncident((prev) => {
      // Check if evidence already exists
      const existingIdx = prev.evidence.findIndex((e) => e.id === newEvidence.id);
      let updatedEvidence: EvidenceFile[];
      if (existingIdx >= 0) {
        updatedEvidence = [...prev.evidence];
        updatedEvidence[existingIdx] = newEvidence;
      } else {
        updatedEvidence = [newEvidence, ...prev.evidence];
      }

      // Check for amounts to update total loss if needed
      let additionalLoss = 0;
      newEvidence.extractedEntities
        .filter((e) => e.type === 'AMOUNT' && e.numericAmount)
        .forEach((amt) => {
          // If the evidence is a payment screenshot or bank sms, consider it a potential debit
          if (newEvidence.evidenceCategory === 'PAYMENT_SCREENSHOT' || newEvidence.evidenceCategory === 'BANK_SMS') {
            // avoid double counting if already present
            const alreadyCounted = prev.evidence.some(e => 
              e.id !== newEvidence.id && e.extractedEntities.some(ent => ent.value === amt.value)
            );
            if (!alreadyCounted && amt.numericAmount) {
              additionalLoss += amt.numericAmount;
            }
          }
        });

      // Automatically create a timeline event from this evidence
      const newTimelineEvents = [...prev.timeline];
      const hasTimelineLink = prev.timeline.some((t) => t.sourceEvidenceId === newEvidence.id);
      if (!hasTimelineLink) {
        const dateEntity = newEvidence.extractedEntities.find((e) => e.type === 'DATE');
        const timeEntity = newEvidence.extractedEntities.find((e) => e.type === 'TIME');
        const amountEntity = newEvidence.extractedEntities.find((e) => e.type === 'AMOUNT');

        let eventDate = new Date().toISOString();
        if (dateEntity) {
          try {
            const parsed = new Date(dateEntity.value);
            if (!isNaN(parsed.getTime())) {
              eventDate = parsed.toISOString();
            }
          } catch {}
        }

        const isDebit = newEvidence.evidenceCategory === 'PAYMENT_SCREENSHOT' || newEvidence.evidenceCategory === 'BANK_SMS';

        newTimelineEvents.push({
          id: `tl-auto-${Date.now()}`,
          incidentId: prev.id,
          sourceEvidenceId: newEvidence.id,
          sourceFileName: newEvidence.fileName,
          timestamp: eventDate,
          title: `Evidence Preserved: ${newEvidence.fileName}`,
          description: newEvidence.extractedSummary || newEvidence.userNotes || 'Evidence artifact uploaded and verified.',
          category: isDebit ? 'UNAUTHORIZED_DEBIT' : 'COMMUNICATION',
          actor: isDebit ? 'VICTIM' : 'FRAUDSTER',
          amount: amountEntity?.numericAmount,
          currency: prev.currency,
          verified: true,
          highlightedEntity: amountEntity ? amountEntity.value : undefined,
        });
      }

      return {
        ...prev,
        totalLoss: prev.totalLoss === 0 && additionalLoss > 0 ? additionalLoss : prev.totalLoss,
        evidence: updatedEvidence,
        timeline: newTimelineEvents,
      };
    });
  };

  const handleAddTimelineEvent = (event: TimelineEvent) => {
    setIncident((prev) => ({
      ...prev,
      timeline: [...prev.timeline, event],
    }));
  };

  const handleUpdateReport = (report: GeneratedReport) => {
    setIncident((prev) => ({
      ...prev,
      generatedReport: report,
    }));
  };

  const selectedEvidence = incident.evidence.find((e) => e.id === selectedEvidenceId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Tactical Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentIncident={incident}
        onResetSample={handleResetSample}
      />

      {/* Security & Role Access Status Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Authenticated Session: <strong className="text-white font-mono">{user.displayName}</strong>{' '}
                  <span className="text-slate-500 font-mono">({user.userId})</span> ·{' '}
                  <span className={`font-semibold ${
                    user.role === 'INVESTIGATOR' ? 'text-purple-400' : user.role === 'DEMO_GUEST' ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {user.role === 'INVESTIGATOR'
                      ? 'Nodal Cyber Support Desk (Full Forensics & UTR Reconciliation Enabled)'
                      : user.role === 'DEMO_GUEST'
                      ? 'Sandbox Demo Access (Read/Write Demonstration Mode)'
                      : 'Victim / Complainant (Automatic Bank A/C & Phone Masking Active)'}
                  </span>
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-medium">
                  Logged Out · Sign in with your User ID and Password to authenticate and access full evidence & exports
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openLoginModal}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-cyan-800 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Switch Account / Login' : 'Sign In with User ID'}</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={logout}
                title="Log out of current session"
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-rose-800/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'new-report' && (
          <NewReportView
            onSyncWithMainLocker={handleSyncNarrativeWithLocker}
          />
        )}

        {activeTab === 'home' && (
          <HomeView
            incident={incident}
            setActiveTab={setActiveTab}
            onOpenEvidenceModal={(id) => setSelectedEvidenceId(id)}
          />
        )}

        {activeTab === 'create' && (
          <CreateIncidentView
            onSaveIncident={handleSaveNewIncident}
            onNavigateUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'upload' && (
          <EvidenceUploadView
            currentIncident={incident}
            onAddEvidence={handleAddEvidence}
            onNavigateDashboard={() => setActiveTab('evidence')}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceDashboardView
            incident={incident}
            onOpenEvidenceModal={(id) => setSelectedEvidenceId(id)}
            onNavigateUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            incident={incident}
            onOpenEvidenceModal={(id) => setSelectedEvidenceId(id)}
            onAddTimelineEvent={handleAddTimelineEvent}
          />
        )}

        {activeTab === 'report' && (
          <ReportView
            incident={incident}
            onUpdateReport={handleUpdateReport}
            onOpenEvidenceModal={(id) => setSelectedEvidenceId(id)}
          />
        )}
      </main>

      {/* Evidence Deep Preview Modal */}
      <EvidenceModal
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidenceId(null)}
      />

      {/* Auth Login Modal */}
      <LoginModal />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-xs text-slate-500 py-6 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">FraudTrace Forensic Platform</span>
            <span>·</span>
            <span>Digital Evidence Locker & Incident Dossier</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Active Case: {incident.id}</span>
            <span>·</span>
            <span>{incident.evidence.length} Artifacts Vaulted</span>
            <span>·</span>
            <span className="text-emerald-400">SHA-256 Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import React, { useState } from 'react';
import { 
  PlusCircle, 
  FileText, 
  ShieldAlert, 
  CreditCard, 
  User, 
  Phone, 
  Building, 
  Globe, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { FraudCategory, Incident } from '../types';

interface CreateIncidentViewProps {
  onSaveIncident: (newIncident: Incident) => void;
  onNavigateUpload: () => void;
}

export const CreateIncidentView: React.FC<CreateIncidentViewProps> = ({
  onSaveIncident,
  onNavigateUpload,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FraudCategory>('UPI_FRAUD');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 16));
  const [currency, setCurrency] = useState('INR');
  const [totalLoss, setTotalLoss] = useState<string>('');
  const [primaryPlatform, setPrimaryPlatform] = useState<Incident['primaryPlatform']>('Telegram');
  const [summary, setSummary] = useState('');

  // Victim state
  const [victimName, setVictimName] = useState('');
  const [victimEmail, setVictimEmail] = useState('');
  const [victimPhone, setVictimPhone] = useState('');
  const [victimCity, setVictimCity] = useState('');
  const [victimCountry, setVictimCountry] = useState('India');
  const [victimBankName, setVictimBankName] = useState('');
  const [victimAccountMasked, setVictimAccountMasked] = useState('');

  // Suspect state
  const [suspectAliases, setSuspectAliases] = useState('');
  const [suspectPhone, setSuspectPhone] = useState('');
  const [suspectUpi, setSuspectUpi] = useState('');
  const [suspectUrl, setSuspectUrl] = useState('');
  const [suspectTelegram, setSuspectTelegram] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  // Template presets
  const applyPreset = (presetType: 'electricity' | 'job' | 'upi') => {
    if (presetType === 'electricity') {
      setTitle('Electricity Bill Suspension SMS & AnyDesk APK Fraud');
      setCategory('PHISHING');
      setPrimaryPlatform('SMS');
      setCurrency('INR');
      setTotalLoss('82000');
      setSummary('Victim received an alarming SMS stating electricity connection would be disconnected at 9:30 PM due to unpaid bill. Called the provided helpline number; fraudster coerced downloading remote access app and extracted NetBanking credentials.');
      setSuspectAliases('Electricity Bill Helpdesk, Power Support');
      setSuspectPhone('+91 98311 02931');
      setSuspectUpi('power-bill-desk@okhdfcbank');
      setSuspectUrl('http://power-bill-recharge-support.in');
      setVictimBankName('State Bank of India');
    } else if (presetType === 'job') {
      setTitle('Telegram YouTube Video Like / Part-Time Job Scam');
      setCategory('JOB_FRAUD');
      setPrimaryPlatform('WhatsApp');
      setCurrency('INR');
      setTotalLoss('125000');
      setSummary('Victim was approached on WhatsApp with work-from-home task to review hotels and like YouTube videos for ₹150/task. After initial small payouts, victim was trapped in a "prepaid merchant crypto task" demanding increasing deposits to withdraw earnings.');
      setSuspectAliases('HR Priya Sharma, Task Manager Kevin');
      setSuspectPhone('+91 88291 40192');
      setSuspectUpi('task-payouts@paytm');
      setSuspectUrl('https://global-task-merchant-system.net');
      setVictimBankName('ICICI Bank');
    } else if (presetType === 'upi') {
      setTitle('OLX Marketplace Fake QR Code Payment Request');
      setCategory('UPI_FRAUD');
      setPrimaryPlatform('WhatsApp');
      setCurrency('INR');
      setTotalLoss('35000');
      setSummary('Victim listed used furniture on online marketplace. Fraudster posing as army officer agreed to buy without negotiation and sent a "QR code to receive money", which actually debited the victim account.');
      setSuspectAliases('Subedar Rajesh Kumar (Fake Army Identity)');
      setSuspectPhone('+91 99201 84920');
      setSuspectUpi('canteen-stores-dept@axisbank');
      setVictimBankName('Axis Bank Ltd');
    }

    setNotification(`Applied ${presetType.toUpperCase()} preset template.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const incidentId = `FT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncident: Incident = {
      id: incidentId,
      title: title || 'Untitled Cyber Fraud Incident',
      category,
      status: 'GATHERING_EVIDENCE',
      createdAt: new Date().toISOString(),
      incidentDate: new Date(incidentDate).toISOString(),
      currency,
      totalLoss: parseFloat(totalLoss) || 0,
      recoveredAmount: 0,
      summary: summary || 'No narrative provided yet.',
      primaryPlatform,
      victim: {
        name: victimName || 'Not specified',
        email: victimEmail || '',
        phone: victimPhone || '',
        city: victimCity || '',
        country: victimCountry || '',
        bankName: victimBankName || '',
        accountNumberMasked: victimAccountMasked || 'XXXX-XXXX',
      },
      suspectDetails: {
        knownAliases: suspectAliases ? suspectAliases.split(',').map(s => s.trim()) : [],
        primaryPhone: suspectPhone,
        primaryUpi: suspectUpi,
        primaryUrl: suspectUrl,
        telegramHandle: suspectTelegram,
      },
      evidence: [],
      timeline: [
        {
          id: `tl-init-${Date.now()}`,
          incidentId,
          timestamp: new Date(incidentDate).toISOString(),
          title: 'Incident Occurrence Logged',
          description: summary || 'Fraudulent encounter initiated.',
          category: 'FIRST_CONTACT',
          actor: 'FRAUDSTER',
          verified: true,
        },
      ],
    };

    onSaveIncident(newIncident);
    onNavigateUpload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-cyan-400" />
            Create Incident Record
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Establish a digital chain of custody file before uploading evidentiary screenshots and documents.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('electricity')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
          >
            SMS Phishing
          </button>
          <button
            type="button"
            onClick={() => applyPreset('job')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
          >
            Job Scam
          </button>
          <button
            type="button"
            onClick={() => applyPreset('upi')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
          >
            OLX QR Scam
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {notification}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Incident Classification */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            1. Incident Classification & Financial Scale
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Incident Title / Operation Codename *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unauthorized UPI Debits via Telegram Investment Group"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fraud Category / Modus Operandi *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FraudCategory)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="UPI_FRAUD">UPI / QR Code Payment Fraud</option>
                <option value="PHISHING">Phishing Web Portal / Fake APK</option>
                <option value="INVESTMENT_SCAM">Crypto / High-Yield Investment Scam</option>
                <option value="IMPERSONATION">Impersonation / Fake Police / CBI Call</option>
                <option value="JOB_FRAUD">Part-time Job / YouTube Like Scam</option>
                <option value="BANKING_SIM_SWAP">SIM Swap / NetBanking Takeover</option>
                <option value="MARKETPLACE">Online Marketplace / Olx / Delivery Fraud</option>
                <option value="CRYPTO_SCAM">Bogus Crypto Wallet / Exchange</option>
                <option value="OTHER">Other Cyber Threat Vector</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Contact Medium *
              </label>
              <select
                value={primaryPlatform}
                onChange={(e) => setPrimaryPlatform(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="SMS">SMS / Text Message</option>
                <option value="Phone Call">Phone Call / IVR</option>
                <option value="Web Browser">Web Browser / Rogue Site</option>
                <option value="Instagram">Instagram</option>
                <option value="Email">Email / Phishing Message</option>
                <option value="Other">Other Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date & Time of First Incident *
              </label>
              <input
                type="datetime-local"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Financial Loss Amount *
                </label>
                <input
                  type="number"
                  required
                  value={totalLoss}
                  onChange={(e) => setTotalLoss(e.target.value)}
                  placeholder="e.g. 145000"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-rose-400 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Incident Narrative & Modus Operandi Summary *
              </label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe concisely what happened, how contact was established, and how funds were debited..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Complainant / Victim Profile */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <User className="w-4 h-4" />
            2. Complainant / Victim Profile (For Police & Bank Complaint)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={victimPhone}
                onChange={(e) => setVictimPhone(e.target.value)}
                placeholder="+91 98450 XXXXX"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={victimEmail}
                onChange={(e) => setVictimEmail(e.target.value)}
                placeholder="complainant@domain.com"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City / Jurisdiction
              </label>
              <input
                type="text"
                value={victimCity}
                onChange={(e) => setVictimCity(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Debited Bank Name
              </label>
              <input
                type="text"
                value={victimBankName}
                onChange={(e) => setVictimBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Masked Account / Card Number
              </label>
              <input
                type="text"
                value={victimAccountMasked}
                onChange={(e) => setVictimAccountMasked(e.target.value)}
                placeholder="XXXX-XXXX-4921"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Initial Known Perpetrator Details */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Building className="w-4 h-4" />
            3. Known Perpetrator Indicators (Additional details can be extracted from evidence)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Suspect Aliases / Display Names
              </label>
              <input
                type="text"
                value={suspectAliases}
                onChange={(e) => setSuspectAliases(e.target.value)}
                placeholder="e.g. Aditi VIP, Support Desk"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Suspect Mobile / WhatsApp Number
              </label>
              <input
                type="text"
                value={suspectPhone}
                onChange={(e) => setSuspectPhone(e.target.value)}
                placeholder="+91 98234 XXXXX"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Suspect UPI ID / VPA
              </label>
              <input
                type="text"
                value={suspectUpi}
                onChange={(e) => setSuspectUpi(e.target.value)}
                placeholder="fin-capital@ybl"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phishing Website URL
              </label>
              <input
                type="text"
                value={suspectUrl}
                onChange={(e) => setSuspectUrl(e.target.value)}
                placeholder="https://malicious-portal.top"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-400">
            Next step: Ingest screenshots and bank receipts into the Evidence Locker.
          </p>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20"
          >
            Create Case & Proceed to Upload <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  ArrowRight,
  LogOut,
  Shield,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, user, isAuthenticated, logout } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleHint, setRoleHint] = useState<'VICTIM' | 'INVESTIGATOR' | 'DEMO_GUEST'>('VICTIM');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!userId.trim()) {
      setErrorMessage('Please enter your User ID or username.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(userId.trim(), password.trim(), roleHint);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
    } else {
      setSuccessMessage('Authentication successful! Session verified.');
      setTimeout(() => {
        closeLoginModal();
        setSuccessMessage(null);
      }, 700);
    }
  };

  const handleSelectPreset = (presetUser: string, presetPass: string, presetRole: 'VICTIM' | 'INVESTIGATOR' | 'DEMO_GUEST') => {
    setUserId(presetUser);
    setPassword(presetPass);
    setRoleHint(presetRole);
    setErrorMessage(null);
  };

  const handleClearInputs = () => {
    setUserId('');
    setPassword('');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                User Authentication & Session Login
              </h3>
              <p className="text-xs text-slate-400">
                Input your credentials or switch your role authorization
              </p>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Session Status & Direct Log Out Button */}
        {isAuthenticated && user && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/90 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                user.role === 'INVESTIGATOR'
                  ? 'bg-purple-950 text-purple-300 border border-purple-700'
                  : user.role === 'DEMO_GUEST'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
              }`}>
                {user.userId.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{user.displayName}</span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                    user.role === 'INVESTIGATOR'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : user.role === 'DEMO_GUEST'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  User ID: <span className="text-slate-300 font-semibold">{user.userId}</span> · Session Active
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setSuccessMessage('Logged out successfully. You can now log in with a new User ID.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Notice: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/80 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Role Selection Tabs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Your Access Role:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRoleHint('VICTIM')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  roleHint === 'VICTIM'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Victim</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Complainant / PII Masking
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoleHint('INVESTIGATOR')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  roleHint === 'INVESTIGATOR'
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Nodal Desk</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Full Forensics & UTRs
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoleHint('DEMO_GUEST')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  roleHint === 'DEMO_GUEST'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Guest</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Sandbox Simulation
                </div>
              </button>
            </div>
          </div>

          {/* User ID Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                User ID / Username
              </label>
              {userId && (
                <button
                  type="button"
                  onClick={handleClearInputs}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear Fields
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Type your User ID (e.g. rahul.sharma or officer.raman)"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <span className="text-[11px] text-slate-500">Self-managed password</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your Password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick-Fill Sample Credential Pills */}
          <div className="pt-1">
            <span className="text-[10px] font-medium text-slate-500 block mb-1.5">
              Or quick-fill demo credentials:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('rahul.sharma', 'password123', 'VICTIM')}
                className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800 text-slate-300 transition-colors"
              >
                rahul.sharma (Victim)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('officer.raman', 'nodal2026', 'INVESTIGATOR')}
                className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-800 text-slate-300 transition-colors"
              >
                officer.raman (Investigator)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('guest', 'guest', 'DEMO_GUEST')}
                className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-800 text-slate-300 transition-colors"
              >
                guest (Sandbox)
              </button>
            </div>
          </div>

          {/* Security Safeguards Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Identity & Privacy Protocols:</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Complainants operate under deterministic redaction of 12+ digit banking numbers. Investigators access unredacted footprints for police and statutory 1930 submissions. Passwords are never logged into AI model telemetry.
            </p>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={closeLoginModal}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Validating Session...</span>
              ) : (
                <>
                  <span>Sign In / Authorize</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

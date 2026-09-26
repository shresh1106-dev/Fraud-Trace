import React from 'react';
import { 
  ShieldAlert, 
  Home, 
  PlusCircle, 
  UploadCloud, 
  FolderLock, 
  Milestone, 
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  User,
  KeyRound,
  ShieldCheck,
  Lock,
  LogOut
} from 'lucide-react';
import { Incident } from '../types';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'new-report' | 'home' | 'create' | 'upload' | 'evidence' | 'timeline' | 'report';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentIncident: Incident;
  onResetSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentIncident,
  onResetSample,
}) => {
  const { user, isAuthenticated, openLoginModal, logout } = useAuth();

  const totalEntities = currentIncident.evidence.reduce(
    (acc, ev) => acc + (ev.extractedEntities?.length || 0),
    0
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('new-report')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-sm shadow-cyan-950">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  FraudTrace
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                    Forensic
                  </span>
                </span>
                <span className="block text-xs text-slate-400 font-medium">
                  Evidence Locker & Incident Dossier
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('new-report')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'new-report'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-cyan-400 hover:text-white hover:bg-slate-900/80 border border-cyan-900/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              New Report
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                activeTab === 'new-report' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-950 text-cyan-300'
              }`}>
                Fast
              </span>
            </button>

            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'create'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Incident
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors relative ${
                activeTab === 'upload'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Evidence Upload
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'evidence'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              Evidence Dashboard
              {currentIncident.evidence.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                  {currentIncident.evidence.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Milestone className="w-4 h-4" />
              Timeline
              {currentIncident.timeline.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {currentIncident.timeline.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'report'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              Incident Report
            </button>
          </nav>

          {/* Active Case Badge & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-slate-400">Case:</span>
              <span className="font-mono font-semibold text-cyan-300">{currentIncident.id}</span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-400 font-semibold font-mono">
                {currentIncident.currency} {currentIncident.totalLoss.toLocaleString()}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{totalEntities} entities</span>
            </div>

            {/* Authentication Login / User Session Badge & Direct Log Out */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={openLoginModal}
                  title="Click to view session details or switch account"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    user.role === 'INVESTIGATOR'
                      ? 'bg-purple-950 text-purple-300 border border-purple-700'
                      : user.role === 'DEMO_GUEST'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  }`}>
                    {user.userId.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="font-bold text-slate-200 text-[11px] max-w-[100px] truncate">
                      {user.displayName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-cyan-400">
                      {user.role}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    user.role === 'INVESTIGATOR'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                      : user.role === 'DEMO_GUEST'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                  }`}>
                    {user.role === 'INVESTIGATOR' ? 'Nodal Desk' : user.role === 'DEMO_GUEST' ? 'Sandbox' : 'Complainant'}
                  </span>
                </button>

                <button
                  onClick={logout}
                  title="Log out of active session"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/60 transition-all shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden md:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-lg shadow-sm shadow-cyan-500/20 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In / Login</span>
              </button>
            )}

            <button
              onClick={onResetSample}
              title="Reset or load realistic demonstration sample case"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Sample</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav strip */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('new-report')}
            className={`px-2.5 py-1 rounded font-bold whitespace-nowrap ${
              activeTab === 'new-report' ? 'text-slate-950 bg-cyan-400' : 'text-cyan-400'
            }`}
          >
            ★ New Report
          </button>
          <button
            onClick={() => setActiveTab('home')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'home' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'create' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'upload' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'evidence' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Evidence ({currentIncident.evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'timeline' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Timeline ({currentIncident.timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'report' ? 'text-cyan-300 bg-cyan-950' : 'text-slate-400'
            }`}
          >
            Report
          </button>
          {isAuthenticated && user ? (
            <button
              onClick={logout}
              className="px-2 py-1 rounded font-semibold whitespace-nowrap text-rose-300 bg-rose-950/60 border border-rose-800/80 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="px-2 py-1 rounded font-semibold whitespace-nowrap text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

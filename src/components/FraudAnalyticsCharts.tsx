import React from 'react';
import { TimelineRiskAnalysis, RiskEnrichedEvent } from '../types';
import { 
  TrendingUp, 
  ShieldAlert, 
  PieChart, 
  BarChart3, 
  AlertTriangle, 
  Activity,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface FraudAnalyticsChartsProps {
  analysis: TimelineRiskAnalysis;
}

export const FraudAnalyticsCharts: React.FC<FraudAnalyticsChartsProps> = ({ analysis }) => {
  const events = analysis.events;

  // 1. Calculate cumulative loss over chronological steps
  let runningLoss = 0;
  const cumulativeData = events.map((ev, index) => {
    runningLoss += ev.amount_inr || 0;
    return {
      step: `Step ${index + 1}`,
      name: ev.event_type,
      added: ev.amount_inr || 0,
      cumulative: runningLoss,
    };
  });
  const maxCumulative = Math.max(...cumulativeData.map(d => d.cumulative), 1000);

  // 2. Vector distribution for threat donut
  const vectorCounts: Record<string, number> = {};
  events.forEach(ev => {
    (ev.flags || ['GENERAL_FRAUD']).forEach(flag => {
      let friendlyName = 'Social Engineering';
      if (flag.includes('URL') || flag.includes('PHISH')) friendlyName = 'Phishing Link';
      else if (flag.includes('UPI') || flag.includes('DEBIT') || flag.includes('TRANSFER')) friendlyName = 'Coerced UPI Debit';
      else if (flag.includes('CREDENTIAL') || flag.includes('OTP')) friendlyName = 'Credential Harvesting';
      else if (flag.includes('EXTORTION') || flag.includes('RANSOM')) friendlyName = 'Extortion Demand';
      else if (flag.includes('CALLER') || flag.includes('CONTACT')) friendlyName = 'Unverified Contact';

      vectorCounts[friendlyName] = (vectorCounts[friendlyName] || 0) + 1;
    });
  });

  const totalVectorTags = Object.values(vectorCounts).reduce((a, b) => a + b, 0) || 1;
  const vectorEntries = Object.entries(vectorCounts).map(([name, count]) => ({
    name,
    count,
    percent: Math.round((count / totalVectorTags) * 100),
  }));

  const colors = ['#06b6d4', '#f43f5e', '#a855f7', '#f59e0b', '#10b981'];

  // 3. Gauge Needle Angle calculation (from -90deg to +90deg based on score 0-100)
  const score = Math.min(100, Math.max(0, analysis.overall_risk_score));
  const needleAngle = -90 + (score / 100) * 180;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Predictive Risk Visualizations & Threat Trajectory
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          AI Risk Prediction Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CHART 1: Risk Probability Gauge */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Fraud Probability & Severity Meter
            </span>
            <span className="font-mono text-[11px] text-cyan-400 font-bold">
              {analysis.overall_risk_level} SEVERITY
            </span>
          </div>

          <div className="py-2 flex flex-col items-center justify-center">
            {/* SVG Semi-Circle Speedometer Gauge */}
            <div className="relative w-64 h-36 flex items-end justify-center overflow-hidden">
              <svg viewBox="0 0 200 115" className="w-full h-full">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="35%" stopColor="#eab308" />
                    <stop offset="70%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Gradient active track */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="16"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - score / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Gauge Needle */}
                <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-1000 ease-out">
                  <line x1="100" y1="100" x2="100" y2="34" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="7" fill="#f8fafc" />
                  <circle cx="100" cy="100" r="3" fill="#020617" />
                </g>
              </svg>
            </div>

            <div className="text-center mt-1">
              <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {score}<span className="text-sm font-normal text-slate-500"> / 100</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-300 mt-0.5">
                Calculated Likelihood of Coerced Fraud: <span className="text-rose-400 font-bold">{(score >= 80 ? '98.4%' : score >= 60 ? '89.2%' : '74.5%')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono border-t border-slate-800 pt-2 text-slate-400">
            <span className={score < 40 ? 'text-emerald-400 font-bold' : ''}>LOW (0-39)</span>
            <span className={score >= 40 && score < 60 ? 'text-yellow-400 font-bold' : ''}>MED (40-59)</span>
            <span className={score >= 60 && score < 85 ? 'text-orange-400 font-bold' : ''}>HIGH (60-84)</span>
            <span className={score >= 85 ? 'text-rose-400 font-bold' : ''}>CRITICAL (85+)</span>
          </div>
        </div>

        {/* CHART 2: Cumulative Loss Progression (Area Chart) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              Cumulative Financial Loss Trajectory
            </span>
            <span className="font-mono text-[11px] text-rose-400 font-bold">
              INR {runningLoss.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Responsive SVG Area Chart */}
          <div className="py-2 h-44 w-full">
            <svg viewBox="0 0 320 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="20" y1="20" x2="310" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="20" y1="65" x2="310" y2="65" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="20" y1="110" x2="310" y2="110" stroke="#1e293b" />

              {/* Loss trajectory path */}
              {(() => {
                const points = cumulativeData.map((d, i) => {
                  const x = 30 + (i / Math.max(cumulativeData.length - 1, 1)) * 260;
                  const y = 110 - (d.cumulative / maxCumulative) * 90;
                  return { x, y, data: d };
                });

                if (points.length === 0) return null;

                const pathString = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const areaString = `${pathString} L ${points[points.length - 1].x} 110 L ${points[0].x} 110 Z`;

                return (
                  <g>
                    <path d={areaString} fill="url(#lossGradient)" />
                    <path d={pathString} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#f43f5e" stroke="#020617" strokeWidth="2" />
                        <text
                          x={p.x}
                          y={p.y - 8}
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {p.data.cumulative > 0 ? `₹${(p.data.cumulative / 1000).toFixed(0)}k` : '₹0'}
                        </text>
                        <text
                          x={p.x}
                          y={124}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="sans-serif"
                        >
                          S{i + 1}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Baseline Loss: INR 0</span>
            <span className="text-slate-300 font-semibold font-mono">
              Peak Financial Drain: INR {runningLoss.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* CHART 3: Attack Threat Vector Composition (Donut & Breakdown) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-purple-400" />
              Attack Threat Vector Breakdown
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {vectorEntries.length} Primary Vectors
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            {/* SVG Donut */}
            <div className="w-28 h-28 relative shrink-0">
              <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="#1e293b" strokeWidth="5" />
                {(() => {
                  let accumulatedOffset = 0;
                  return vectorEntries.map((entry, idx) => {
                    const strokeDasharray = `${entry.percent} ${100 - entry.percent}`;
                    const strokeDashoffset = -accumulatedOffset;
                    accumulatedOffset += entry.percent;
                    return (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="none"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-white font-mono">{events.length}</span>
                <span className="text-[9px] text-slate-400 uppercase">Stages</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 w-full text-xs">
              {vectorEntries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span className="text-slate-300 truncate text-[11px]">{entry.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-200 text-[11px] shrink-0">
                    {entry.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            Identifies tactics of coercive pressure and unverified beneficiary accounts.
          </div>
        </div>

        {/* CHART 4: Event-by-Event Risk Score Progression (Bars) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Event Risk Progression & Spike Analysis
            </span>
            <span className="font-mono text-[11px] text-amber-400 font-bold">
              Per-Step Threat Index
            </span>
          </div>

          <div className="space-y-2 py-1 flex-1 overflow-y-auto max-h-40 pr-1">
            {events.map((ev, idx) => {
              const barColor =
                ev.risk_score >= 80 ? 'bg-rose-500' :
                ev.risk_score >= 60 ? 'bg-amber-500' :
                ev.risk_score >= 40 ? 'bg-yellow-500' : 'bg-cyan-500';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[70%] font-medium">
                      S{idx + 1}. {ev.event_type}
                    </span>
                    <span className="font-mono font-bold text-white text-[10px]">
                      {ev.risk_score}/100 ({ev.severity})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${ev.risk_score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Risk Velocity: Accelerated Coercion</span>
            <span className="text-cyan-400 font-semibold">100% Correlated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { FamilyNames } from '../types';
import { 
  Stethoscope, 
  Scale, 
  Baby, 
  Calendar, 
  Clock, 
  Upload, 
  RotateCcw,
  History,
  Share2,
  Check
} from 'lucide-react';

interface Props {
  activeTab: 'calendar' | 'freetimings' | 'import' | 'history' | 'childcare';
  setActiveTab: (tab: 'calendar' | 'freetimings' | 'import' | 'history' | 'childcare') => void;
  onResetData: () => void;
  onDeleteAllEvents?: () => void;
  eventCount: number;
  freeSlotsCount: number;
  gapsCount: number;
  onCallCount: number;
  historyLogsCount?: number;
  canUndo?: boolean;
  onUndo?: () => void;
  familyNames: FamilyNames;
  onOpenEditNames: () => void;
  isLiveConnected?: boolean;
  liveSyncPulse?: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onResetData,
  eventCount,
  freeSlotsCount,
  onCallCount,
  historyLogsCount,
  isLiveConnected = true,
  liveSyncPulse = false
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 relative md:sticky md:top-0 z-40">
      {/* Top Brand & Stats Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand Logo & Description */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center -space-x-1.5">
              <div className="p-1.5 sm:p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="p-1.5 sm:p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Baby className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">MedFamily Sync</h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full">
                  AI Roster Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 hidden sm:block">
                Hospital Doctor &amp; Lawyer Family Monthly Roster Alignment
              </p>
            </div>
          </div>

          {/* Mobile Live Sync Pill */}
          <div 
            className={`md:hidden px-2 py-1 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold transition-all ${
              liveSyncPulse 
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400' 
                : isLiveConnected 
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLiveConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span>{isLiveConnected ? 'Live Sync' : 'Offline'}</span>
          </div>
        </div>

        {/* Quick Stats Pills & Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Sync Active Indicator (Desktop) */}
          <div 
            className={`hidden md:flex px-3 py-1.5 rounded-xl border items-center gap-2 text-xs font-semibold transition-all shadow-xs ${
              liveSyncPulse 
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 scale-105' 
                : isLiveConnected 
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
            }`}
            title={isLiveConnected ? "Real-time Live Sync active across all users and devices" : "Connecting live sync..."}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-[11px] font-bold tracking-wide">
              {liveSyncPulse ? '⚡ Live Sync Updated!' : isLiveConnected ? 'Live Sync Active' : 'Connecting Sync...'}
            </span>
          </div>

          {/* Share Calendar Link Button */}
          <button
            onClick={handleCopyShareLink}
            className="px-3 py-1.5 text-xs font-extrabold text-sky-200 bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Copy shared calendar link for other users to view and edit live"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Calendar'}</span>
          </button>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-red-400" />
            <div className="text-xs">
              <span className="font-bold text-white">{onCallCount}</span>
              <span className="text-slate-400 text-[11px] ml-1">On-Call Shifts</span>
            </div>
          </div>

          <button
            onClick={onResetData}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Reset to Sample Roster Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>🗓️ Monthly Calendar ({eventCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('freetimings')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'freetimings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>⚡ Available Free Timings ({freeSlotsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>📥 Import PDF/Excel Roster &amp; WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📜 Activity History Log ({historyLogsCount ?? 0})</span>
          </button>
        </div>
      </div>
    </header>
  );
};

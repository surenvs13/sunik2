import React, { useState } from 'react';
import { FreeSlot, ScheduleEvent, FamilyNames } from '../types';
import { Sparkles, Calendar, Heart, Sun, Bed, Zap, Clock, CheckCircle, Plus, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getConflictingEventsForSlot } from '../utils/rosterUtils';

interface Props {
  freeSlots: FreeSlot[];
  events?: ScheduleEvent[];
  onAddFreeSlotToCalendar: (slot: FreeSlot) => void;
  familyNames: FamilyNames;
}

export const FreeTimingsView: React.FC<Props> = ({
  freeSlots,
  events = [],
  onAddFreeSlotToCalendar,
  familyNames
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());

  // Filter slots to strictly Quality Family Time and Couple Date Nights only
  const availableFreeSlots = freeSlots.filter(
    (slot) => slot.type === 'couple_date' || slot.type === 'quality_family'
  );

  const getCleanFirstName = (name: string) => {
    if (!name) return '';
    const cleaned = name.replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Lawyer)\s+/i, '');
    return cleaned.split(' ')[0] || name;
  };

  const surenName = getCleanFirstName(familyNames.husband) || 'Suren';
  const nicoleName = getCleanFirstName(familyNames.wife) || 'Nicole';
  const gerardName = getCleanFirstName(familyNames.child) || 'Gerard';

  const handleLockIn = (slot: FreeSlot) => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const nextLocked = new Set(lockedIds);
    nextLocked.add(slot.id);
    setLockedIds(nextLocked);

    onAddFreeSlotToCalendar(slot);
  };

  // Evaluate conflicts for each slot against schedule events
  const slotConflictMap = new Map<string, ScheduleEvent[]>();
  availableFreeSlots.forEach((slot) => {
    const conflicts = getConflictingEventsForSlot(slot, events, familyNames);
    if (conflicts.length > 0) {
      slotConflictMap.set(slot.id, conflicts);
    }
  });

  const conflictFreeSlots = availableFreeSlots.filter((slot) => !slotConflictMap.has(slot.id));
  const slotsToDisplay = strictMode ? conflictFreeSlots : availableFreeSlots;

  const filteredSlots = slotsToDisplay.filter((slot) => {
    if (filterType === 'all') return true;
    return slot.type === filterType;
  });

  const coupleCount = conflictFreeSlots.filter((s) => s.type === 'couple_date').length;
  const familyCount = conflictFreeSlots.filter((s) => s.type === 'quality_family').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Free Time & Conflict-Free Overlap Finder</span>
            </div>
            <h2 className="text-xl font-black">Recommended Family Timings</h2>
            <p className="text-xs text-emerald-100 max-w-2xl mt-1">
              Guaranteed clear windows verified against live schedules: {surenName}&apos;s hospital duties are clear, {nicoleName}&apos;s court &amp; client calls are quiet, and 2yo {gerardName} has no conflicting appointments.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-lg font-black text-emerald-300">{conflictFreeSlots.length}</div>
              <div className="text-[10px] text-slate-200 uppercase tracking-wide">Clear Windows</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-lg font-black text-rose-300">
                {coupleCount}
              </div>
              <div className="text-[10px] text-slate-200 uppercase tracking-wide">Date Nights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips & Conflict Check Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Recommended ({slotsToDisplay.length})
          </button>

          <button
            onClick={() => setFilterType('couple_date')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              filterType === 'couple_date'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>💖 Couple Date Nights ({surenName} &amp; {nicoleName}) ({coupleCount})</span>
          </button>

          <button
            onClick={() => setFilterType('quality_family')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              filterType === 'quality_family'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>👨‍👩‍👦 Quality Family Outings ({surenName}, {nicoleName} &amp; {gerardName}) ({familyCount})</span>
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Strict Mode (Zero Conflicts)</span>
        </label>
      </div>

      {/* Slots Cards List */}
      {filteredSlots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Conflict-Free Timings Found for Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All timings in this view currently overlap with scheduled activities. Uncheck &quot;Strict Mode&quot; to review all potential slots or add new events to the calendar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSlots.map((slot) => {
            const isLocked = lockedIds.has(slot.id);
            const conflicts = slotConflictMap.get(slot.id) || [];
            const hasConflicts = conflicts.length > 0;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  hasConflicts
                    ? 'border-amber-300 bg-amber-50/20'
                    : slot.type === 'couple_date'
                    ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50/30'
                    : 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30'
                }`}
              >
                <div>
                  {/* Badge Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        slot.type === 'couple_date'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {slot.type === 'couple_date' && '💖 Couple Date Night'}
                      {slot.type === 'quality_family' && '👨‍👩‍👦 Quality Family Time'}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <span>★ {slot.score}/10 Match</span>
                    </div>
                  </div>

                  {/* Conflict Check Badge */}
                  {!hasConflicts ? (
                    <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Zero Conflicts: {slot.type === 'couple_date' ? `${surenName} & ${nicoleName} are both free` : `${surenName}, ${nicoleName} & ${gerardName} are all free`}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-2.5 p-2 bg-amber-100/80 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-medium space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Conflicting Activities ({conflicts.length}):</span>
                      </div>
                      {conflicts.map((c, i) => (
                        <div key={i} className="text-[10px] text-amber-900 pl-5">
                          • <strong>{c.person}</strong>: &quot;{c.title}&quot; ({c.startTime} - {c.endTime})
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 mb-1">{slot.title}</h3>

                  {/* Time & Date */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 my-2.5 bg-slate-100/70 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{slot.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {slot.startTime} - {slot.endTime} ({slot.durationHours} hrs)
                      </span>
                    </div>
                  </div>

                  {/* Reason Explanation */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {slot.reason}
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isLocked ? '✓ Locked in Calendar' : 'Verified by Gemini AI'}
                  </span>

                  <button
                    onClick={() => handleLockIn(slot)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                      isLocked
                        ? 'bg-emerald-600 text-white'
                        : slot.type === 'couple_date'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Scheduled &amp; Locked</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Lock in Calendar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


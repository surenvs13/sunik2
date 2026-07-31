import React, { useState, useEffect } from 'react';
import { ScheduleEvent, PersonType, EventCategory, FamilyNames } from '../types';
import { X, Calendar, Clock, MapPin, Tag, User, Sparkles, ShieldAlert, CheckCircle2, Stethoscope, Undo2, Lock, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent, additionalEvents?: ScheduleEvent[]) => void;
  initialDate?: string;
  initialCategory?: EventCategory;
  editEvent?: ScheduleEvent | null;
  familyNames: FamilyNames;
  canUndo?: boolean;
  onUndo?: () => void;
}

const CATEGORIES: EventCategory[] = [
  'On-Call 24h',
  'Night Shift',
  'Day Clinic',
  'Post-Call Rest',
  'Ward Rounds',
  'Court Hearing',
  'Late Night Call',
  'Client Briefing',
  'Nursery/Daycare',
  'Pediatrician',
  'Playgroup/Park',
  'Family Outing',
  'Date Night',
  'Bedtime Routine',
  'Church/Catechism',
  'Custom Event',
  'Other'
];

export const COLOR_OPTIONS = [
  { id: 'red', name: 'Red', bg: 'bg-red-500', badgeClass: 'bg-red-100 text-red-900 border-red-300', dot: '🔴', label: 'Doctor / On-Call' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300', dot: '🔵', label: 'Lawyer / Court' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300', dot: '🟠', label: 'Post-Call Rest' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: '🟢', label: 'Family Outing' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300', dot: '💖', label: 'Date Night' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-900 border-purple-300', dot: '🟣', label: 'Special Event' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500', badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300', dot: '🩵', label: 'Child / Daycare' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500', badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300', dot: '🫐', label: 'Evening Shift' },
  { id: 'slate', name: 'Slate', bg: 'bg-slate-500', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300', dot: '⚪', label: 'General / Other' },
];

const addDaysToDateStr = (dateStr: string, days: number = 1): string => {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const AddEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialCategory,
  editEvent,
  familyNames,
  canUndo,
  onUndo
}) => {
  const defaultDate = initialDate || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [person, setPerson] = useState<PersonType>(familyNames.husband);
  const [category, setCategory] = useState<EventCategory>('On-Call 24h');
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState(defaultDate);
  const [endTime, setEndTime] = useState('08:00');
  const [isCallDuty, setIsCallDuty] = useState(false);
  const [isNightShift, setIsNightShift] = useState(false);
  const [requiresPostCallRest, setRequiresPostCallRest] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [colorCode, setColorCode] = useState('red');

  // Specific 24-Hour Call Option State
  const [is24hCall, setIs24hCall] = useState<boolean>(false);
  const [autoCreatePostCallRest, setAutoCreatePostCallRest] = useState<boolean>(true);
  const [hasEditedEndTime, setHasEditedEndTime] = useState<boolean>(false);

  // Synchronize state when editEvent or isOpen changes
  useEffect(() => {
    setHasEditedEndTime(false);
    if (editEvent) {
      setTitle(editEvent.title);
      setPerson(editEvent.person);
      setCategory(editEvent.category);
      setStartDate(editEvent.startDate);
      setStartTime(editEvent.startTime || '08:00');
      setEndDate(editEvent.endDate || editEvent.startDate);
      setEndTime(editEvent.endTime || '17:00');
      setIsCallDuty(!!editEvent.isCallDuty);
      setIsNightShift(!!editEvent.isNightShift);
      setRequiresPostCallRest(!!editEvent.requiresPostCallRest);
      setLocation(editEvent.location || '');
      setNotes(editEvent.notes || '');
      setIs24hCall(editEvent.category === 'On-Call 24h');

      if (editEvent.colorCode) {
        setColorCode(editEvent.colorCode);
      } else {
        const p = (editEvent.person || '').toLowerCase();
        if (p.includes('suren') || p.includes('husband')) setColorCode('red');
        else if (p.includes('nicole') || p.includes('wife')) setColorCode('blue');
        else if (p.includes('gerard') || p.includes('child')) setColorCode('cyan');
        else if (editEvent.category === 'Date Night') setColorCode('rose');
        else if (editEvent.category === 'Family Outing') setColorCode('emerald');
        else if (editEvent.category === 'Post-Call Rest') setColorCode('amber');
        else setColorCode('slate');
      }
    } else {
      const defD = initialDate || new Date().toISOString().split('T')[0];
      const cat = initialCategory || 'Custom Event';
      setTitle('');
      setPerson(familyNames.husband);
      setCategory(cat);
      setStartDate(defD);
      setStartTime('09:00');
      setEndDate(defD);
      setEndTime('17:00');
      setIsCallDuty(false);
      setIsNightShift(false);
      setRequiresPostCallRest(false);
      setLocation('');
      setNotes('');
      setIs24hCall(false);
      setColorCode('purple');
    }
  }, [editEvent, isOpen, initialDate, initialCategory, familyNames]);

  if (!isOpen) return null;

  const enable24hCallMode = () => {
    setIs24hCall(true);
    setCategory('On-Call 24h');
    setIsCallDuty(true);
    setIsNightShift(false);
    setRequiresPostCallRest(true);
    setPerson(familyNames.husband);
    if (!title || title === 'Hospital Duty Shift' || title.includes('24h')) {
      setTitle('Hospital On-Call Duty (Until 12 Midnight)');
    }
    setStartTime('08:00');
    setEndTime('00:00');
    setEndDate(startDate);
    if (!location) setLocation('Hospital Emergency Department & ED Cover');
  };

  const disable24hCallMode = () => {
    setIs24hCall(false);
    setEndDate(startDate);
    setEndTime('17:00');
  };

  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const minutesToTime = (minutes: number): string => {
    const norm = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleStartTimeChange = (newStart: string) => {
    const prevStart = startTime;
    setStartTime(newStart);

    if (is24hCall) return;

    const startMins = timeToMinutes(newStart);
    const endMins = timeToMinutes(endTime);

    if (!hasEditedEndTime) {
      const prevStartMins = timeToMinutes(prevStart);
      let duration = endMins - prevStartMins;
      if (duration <= 0) {
        duration = 60; // Default 1 hour duration
      }

      let newEndMins = startMins + duration;
      if (newEndMins >= 1440) {
        newEndMins = 1439; // 23:59
        if (newEndMins <= startMins) {
          newEndMins = Math.min(startMins + 30, 1439);
        }
      }
      setEndTime(minutesToTime(newEndMins));
    } else if (startDate === endDate && startMins >= endMins) {
      const adjustedEndMins = Math.min(startMins + 60, 1439);
      setEndTime(minutesToTime(adjustedEndMins));
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (is24hCall) {
      setEndDate(newStart);
    } else if (endDate < newStart) {
      setEndDate(newStart);
      if (!hasEditedEndTime || (endDate === newStart && timeToMinutes(startTime) >= timeToMinutes(endTime))) {
        const startMins = timeToMinutes(startTime);
        setEndTime(minutesToTime(Math.min(startMins + 60, 1439)));
      }
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    setHasEditedEndTime(true);
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    setHasEditedEndTime(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editEvent) {
      // Editing Mode: preserve all original event details, ONLY update timing and colorCode
      const updatedEvent: ScheduleEvent = {
        ...editEvent,
        startDate,
        startTime,
        endDate: is24hCall ? startDate : endDate,
        endTime: is24hCall ? '00:00' : endTime,
        colorCode
      };
      onSave(updatedEvent);
      onClose();
      return;
    }

    // Add Mode: full creation logic
    if (!title.trim()) return;

    const newEvent: ScheduleEvent = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      person,
      category,
      startDate,
      startTime,
      endDate: is24hCall ? startDate : endDate,
      endTime: is24hCall ? '00:00' : endTime,
      isCallDuty: is24hCall ? true : isCallDuty,
      isNightShift: is24hCall ? false : isNightShift,
      requiresPostCallRest: is24hCall ? true : requiresPostCallRest,
      location,
      notes,
      source: 'manual',
      colorCode
    };

    const additionalEvents: ScheduleEvent[] = [];

    const isCallType = is24hCall || isCallDuty || category === 'On-Call 24h' || category === 'Night Shift';
    if (isCallType && autoCreatePostCallRest) {
      const restDate = addDaysToDateStr(startDate, 1);
      additionalEvents.push({
        id: `post-call-rest-${Date.now()}`,
        title: 'Post-Call Sleep & Fatigue Recovery',
        person,
        category: 'Post-Call Rest',
        startDate: restDate,
        startTime: '08:30',
        endDate: restDate,
        endTime: '17:00',
        isCallDuty: false,
        isNightShift: false,
        requiresPostCallRest: true,
        location: 'Home / Recovery Rest',
        notes: `Mandatory sleep & fatigue recovery following on-call shift (${title})`,
        source: 'manual',
        colorCode: 'amber'
      });
    }

    onSave(newEvent, additionalEvents.length > 0 ? additionalEvents : undefined);
    onClose();
  };

  const applyPreset = (presetType: 'oncall' | 'lawyercall' | 'datenight' | 'pediatrician' | 'church' | 'custom') => {
    if (presetType === 'oncall') {
      enable24hCallMode();
      setColorCode('red');
    } else if (presetType === 'lawyercall') {
      disable24hCallMode();
      setTitle('Late Night US/UK Legal Conference Call');
      setPerson(familyNames.wife);
      setCategory('Late Night Call');
      setIsCallDuty(true);
      setIsNightShift(true);
      setStartTime('21:00');
      setEndTime('23:00');
      setLocation('Home Office (Zoom)');
      setColorCode('blue');
    } else if (presetType === 'datenight') {
      disable24hCallMode();
      setTitle('Couple Date Night Dinner');
      setPerson('Family');
      setCategory('Date Night');
      setIsCallDuty(false);
      setIsNightShift(false);
      setStartTime('19:45');
      setEndTime('22:00');
      setLocation('Downtown Bistro');
      setNotes(`${familyNames.child.split(' ')[0]} in bed by 19:30. Nanny Maya on call.`);
      setColorCode('rose');
    } else if (presetType === 'pediatrician') {
      disable24hCallMode();
      setTitle(`${familyNames.child.split(' ')[0]} Pediatrician Visit`);
      setPerson(familyNames.child);
      setCategory('Pediatrician');
      setStartTime('16:00');
      setEndTime('17:30');
      setLocation('KidCare Clinic');
      setColorCode('cyan');
    } else if (presetType === 'church') {
      disable24hCallMode();
      setTitle('Sunday Holy Mass & Catechism Class');
      setPerson('Family');
      setCategory('Church/Catechism');
      setIsCallDuty(false);
      setIsNightShift(false);
      setStartTime('09:00');
      setEndTime('11:30');
      setLocation('St. Mary Cathedral');
      setNotes('Weekly family church service and children catechism.');
      setColorCode('slate');
    } else if (presetType === 'custom') {
      disable24hCallMode();
      setTitle('Custom Family Event');
      setPerson('Family');
      setCategory('Custom Event');
      setIsCallDuty(false);
      setIsNightShift(false);
      setStartTime('10:00');
      setEndTime('12:00');
      setLocation('');
      setColorCode('purple');
    }
  };

  const isEditing = !!editEvent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-xl border border-sky-400/30">
              {isEditing ? <Clock className="w-5 h-5 text-sky-300" /> : <Calendar className="w-5 h-5 text-sky-300" />}
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {isEditing ? 'Edit Event Timing & Color Code' : 'Add New Event'}
              </h3>
              <p className="text-xs text-sky-200">
                {isEditing
                  ? 'Adjust timing and assign custom color tag for scheduled event'
                  : 'Add custom family, work, or personal commitments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* EDITING MODE: LOCKED DETAILS SUMMARY BANNER */}
          {isEditing && editEvent && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {editEvent.person}
                </span>
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Event Details Locked
                </span>
              </div>
              <div>
                <h4 className="text-base font-black text-white">{editEvent.title}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium">
                    Category: {editEvent.category}
                  </span>
                  {editEvent.location && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium">
                      📍 {editEvent.location}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-amber-200/90 font-medium pt-1 border-t border-slate-800/80 flex items-center gap-1.5">
                <span>🔒</span>
                <span>Only the <strong>Event Timing</strong> and <strong>Color Code</strong> can be modified for existing scheduled events.</span>
              </p>
            </div>
          )}

          {/* EDITABLE SECTION 1: EVENT TIMING */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Event Timing &amp; Duration</span>
              </label>
              {isEditing && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ⚡ Editable Field
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Start Date &amp; Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>End Date &amp; Time</span>
                  {is24hCall && (
                    <span className="text-[10px] text-red-600 font-extrabold">+1 Day (24 Hours)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    disabled={is24hCall}
                    value={is24hCall ? addDaysToDateStr(startDate, 1) : endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className={`px-2.5 py-2 text-xs border rounded-xl font-medium ${
                      is24hCall ? 'bg-red-50 text-red-900 border-red-300 font-bold' : 'bg-white border-slate-300 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  <input
                    type="time"
                    required
                    disabled={is24hCall}
                    value={is24hCall ? startTime : endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className={`px-2.5 py-2 text-xs border rounded-xl font-medium ${
                      is24hCall ? 'bg-red-50 text-red-900 border-red-300 font-bold' : 'bg-white border-slate-300 focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EDITABLE SECTION 2: COLOR CODE TAG */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Event Color Code Tag</span>
              </label>
              {isEditing && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ⚡ Editable Field
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {COLOR_OPTIONS.map((opt) => {
                const isSelected = colorCode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColorCode(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? `${opt.badgeClass} ring-2 ring-indigo-600 scale-105 shadow-sm font-bold`
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{opt.dot}</span>
                      <span className="text-xs font-extrabold">{opt.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 text-center font-medium truncate max-w-full">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ADD MODE ONLY FIELDS */}
          {!isEditing && (
            <>
              {/* Quick Presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quick Fill Templates:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('lawyercall')}
                    className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    ⚖️ Late Lawyer Call
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('datenight')}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    💖 Couple Date Night
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('pediatrician')}
                    className="px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                    🧸 {familyNames.child.split(' ')[0]} Pediatrician
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('church')}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ⛪ Church / Catechism
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('custom')}
                    className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    ✨ Custom Event
                  </button>
                  {canUndo && onUndo && (
                    <button
                      type="button"
                      onClick={() => onUndo()}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-xs"
                      title="Undo last schedule action"
                    >
                      <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event / Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Family Park Outing / High Court Hearing / Pediatrician Checkup"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Person & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" /> Person / Family Member
                  </label>
                  <select
                    value={person}
                    onChange={(e) => setPerson(e.target.value as PersonType)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value={familyNames.husband}>🩺 {familyNames.husband}</option>
                    <option value={familyNames.wife}>⚖️ {familyNames.wife}</option>
                    <option value={familyNames.child}>🧸 {familyNames.child}</option>
                    <option value="Family">👨‍👩‍👦 Family (Joint / Couple)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500" /> Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as EventCategory;
                      setCategory(cat);
                      if (cat === 'On-Call 24h') {
                        enable24hCallMode();
                      } else if (is24hCall && (cat as string) !== 'On-Call 24h') {
                        setIs24hCall(false);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-colors ${
                    isNightShift ? 'bg-indigo-50/80 border-indigo-300 font-bold text-indigo-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isNightShift}
                    onChange={(e) => setIsNightShift(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Night / Overnight Shift</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-colors ${
                    requiresPostCallRest ? 'bg-amber-50/80 border-amber-300 font-bold text-amber-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={requiresPostCallRest}
                    onChange={(e) => setRequiresPostCallRest(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Needs Post-Call Rest</span>
                </label>
              </div>

              {/* Location & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location / Hospital Unit
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ward 7A / Emergency ED / High Court"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Context
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Nanny Maya babysitting, or grand rounds cover"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                is24hCall ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {is24hCall && <Stethoscope className="w-4 h-4" />}
              <span>
                {isEditing
                  ? 'Save Timing & Color Changes'
                  : is24hCall
                  ? 'Add 24h Hospital Call Event'
                  : 'Add Event to Calendar'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

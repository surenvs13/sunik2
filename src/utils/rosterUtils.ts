import { ScheduleEvent, FreeSlot, FamilyNames } from '../types';

export const addDaysToDateStr = (dateStr: string, days: number = 1): string => {
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

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const checkTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  let s1 = timeToMinutes(start1);
  let e1 = timeToMinutes(end1);
  if (e1 === 0 && s1 > 0) e1 = 1440; // 00:00 at end of day means 24:00

  let s2 = timeToMinutes(start2);
  let e2 = timeToMinutes(end2);
  if (e2 === 0 && s2 > 0) e2 = 1440; // 00:00 at end of day means 24:00

  return s1 < e2 && e1 > s2;
};

export const getConflictingEventsForSlot = (
  slot: { date: string; startTime: string; endTime: string; type: string },
  events: ScheduleEvent[],
  familyNames: FamilyNames
): ScheduleEvent[] => {
  const husbandName = familyNames.husband || 'Suren';
  const wifeName = familyNames.wife || 'Nicole';
  const childName = familyNames.child || 'Gerard';

  return events.filter((ev) => {
    // 1. Check date overlap:
    if (ev.startDate > slot.date || ev.endDate < slot.date) {
      return false;
    }

    // Determine event's time range on slot.date
    let evStart = ev.startTime;
    let evEnd = ev.endTime;

    if (ev.startDate < slot.date) {
      evStart = '00:00';
    }
    if (ev.endDate > slot.date) {
      evEnd = '23:59';
    }

    // Check time overlap
    const hasOverlap = checkTimeOverlap(slot.startTime, slot.endTime, evStart, evEnd);
    if (!hasOverlap) return false;

    // Check person relevance
    const evPersonLower = (ev.person || '').toLowerCase();
    const isHusband =
      ev.person === husbandName ||
      evPersonLower.includes('suren') ||
      evPersonLower.includes('husband') ||
      evPersonLower.includes('doctor') ||
      evPersonLower.includes('dr.');

    const isWife =
      ev.person === wifeName ||
      evPersonLower.includes('nicole') ||
      evPersonLower.includes('wife') ||
      evPersonLower.includes('lawyer');

    const isChild =
      ev.person === childName ||
      evPersonLower.includes('gerard') ||
      evPersonLower.includes('child') ||
      evPersonLower.includes('son') ||
      evPersonLower.includes('2yo') ||
      evPersonLower.includes('noah');

    const isFamily = ev.person === 'Family' || evPersonLower.includes('family') || evPersonLower.includes('couple');

    // For quality_family, ANY event for husband, wife, child, or family is a conflict
    if (slot.type === 'quality_family') {
      return isHusband || isWife || isChild || isFamily;
    }

    // For couple_date, ONLY events for husband, wife, or family are conflicts. Gerard is not involved.
    if (slot.type === 'couple_date') {
      return isHusband || isWife || isFamily;
    }

    return isHusband || isWife || isChild || isFamily;
  });
};

/**
 * Ensures that every On-Call or Night Duty shift for Suren (or doctor)
 * ends at 12 midnight (00:00) on the call date and is followed by a 
 * Post-Call Rest event on the next day.
 */
export const ensurePostCallRestForEvents = (
  events: ScheduleEvent[],
  husbandName: string = 'Suren'
): ScheduleEvent[] => {
  const result: ScheduleEvent[] = [];

  // Step 1: Normalize existing events (capping Suren's calls to 12 Midnight)
  events.forEach((originalEvent) => {
    const event = { ...originalEvent };
    const personLower = (event.person || '').toLowerCase();
    const isSuren =
      event.person === husbandName ||
      personLower.includes('suren') ||
      personLower.includes('husband') ||
      personLower.includes('doctor');

    const catLower = (event.category || '').toLowerCase();
    const titleLower = (event.title || '').toLowerCase();

    const isOnCallDuty =
      event.category === 'On-Call 24h' ||
      event.isCallDuty === true ||
      catLower.includes('on-call') ||
      catLower.includes('call duty') ||
      titleLower.includes('on-call') ||
      titleLower.includes('24h call') ||
      titleLower.includes('on call');

    if (isSuren && isOnCallDuty) {
      // Set call shift to end strictly at 12 midnight (00:00) on the same day
      event.endDate = event.startDate;
      event.endTime = '00:00';
      event.requiresPostCallRest = true;
      event.isCallDuty = true;
      if (!event.title.includes('12 Midnight') && !event.title.includes('Midnight')) {
        event.title = event.title.replace(/24h/gi, 'On-Call').trim();
        if (!event.title.includes('Midnight')) {
          event.title = `${event.title} (Until 12 Midnight)`;
        }
      }
    }

    result.push(event);
  });

  // Step 2: Ensure every call duty shift for Suren has a Post-Call Rest on the next day
  result.forEach((event) => {
    const personLower = (event.person || '').toLowerCase();
    const isSuren =
      event.person === husbandName ||
      personLower.includes('suren') ||
      personLower.includes('husband') ||
      personLower.includes('doctor');

    const catLower = (event.category || '').toLowerCase();
    const titleLower = (event.title || '').toLowerCase();

    const isOnCallDuty =
      event.category === 'On-Call 24h' ||
      event.category === 'Night Shift' ||
      event.isCallDuty === true ||
      event.requiresPostCallRest === true ||
      catLower.includes('on-call') ||
      catLower.includes('night shift') ||
      titleLower.includes('on-call') ||
      titleLower.includes('24h call') ||
      titleLower.includes('night shift') ||
      titleLower.includes('icu shift');

    if (isSuren && isOnCallDuty && event.category !== 'Post-Call Rest') {
      const restDate = addDaysToDateStr(event.startDate, 1);

      // Check if a Post-Call Rest event already exists on restDate for Suren
      const hasPostCallRest = result.some((e) => {
        const ePersonLower = (e.person || '').toLowerCase();
        const eMatchPerson =
          e.person === event.person ||
          (isSuren &&
            (ePersonLower.includes('suren') ||
              ePersonLower.includes('husband') ||
              ePersonLower.includes('doctor')));

        if (!eMatchPerson) return false;

        const isRestDate = e.startDate === restDate || e.endDate === restDate;
        if (!isRestDate) return false;

        const eCatLower = (e.category || '').toLowerCase();
        const eTitleLower = (e.title || '').toLowerCase();

        return (
          e.category === 'Post-Call Rest' ||
          eCatLower.includes('post-call') ||
          eCatLower.includes('post-night') ||
          eTitleLower.includes('post-call') ||
          eTitleLower.includes('post night') ||
          eTitleLower.includes('sleep & recovery')
        );
      });

      if (!hasPostCallRest) {
        result.push({
          id: `post-call-rest-auto-${event.id}-${Date.now()}`,
          title: 'Post-Call Sleep & Fatigue Recovery',
          person: event.person,
          category: 'Post-Call Rest',
          startDate: restDate,
          startTime: '08:30',
          endDate: restDate,
          endTime: '16:00',
          isCallDuty: false,
          isNightShift: false,
          requiresPostCallRest: true,
          location: 'Home / Recovery Rest',
          notes: `Mandatory post-call rest following ${event.title} (${event.startDate})`,
          source: 'doctor_roster'
        });
      }
    }
  });

  return result;
};

import { EventCategory, FamilyNames, ScheduleEvent } from '../types';

const EVENT_CATEGORIES: EventCategory[] = [
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
  'Other',
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getEventsArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) throw new Error('JSON must be an event array or an object containing an events array.');
  if (Array.isArray(payload.events)) return payload.events;
  if (isRecord(payload.data) && Array.isArray(payload.data.events)) return payload.data.events;
  throw new Error('No events array found. Use [...], { "events": [...] }, or { "data": { "events": [...] } }.');
};

const requiredString = (event: Record<string, unknown>, field: string, itemNumber: number) => {
  const value = event[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Event ${itemNumber}: "${field}" is required.`);
  }
  return value.trim();
};

const optionalString = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export const parseScheduleEventsJson = (
  jsonText: string,
  familyNames: FamilyNames,
  idPrefix: string = 'json-wa'
): ScheduleEvent[] => {
  let payload: unknown;

  try {
    payload = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON. Check quotation marks, commas, and brackets.');
  }

  const rawEvents = getEventsArray(payload);
  if (rawEvents.length === 0) throw new Error('The JSON events array is empty.');

  return rawEvents.map((rawEvent, index) => {
    const itemNumber = index + 1;
    if (!isRecord(rawEvent)) throw new Error(`Event ${itemNumber} must be a JSON object.`);

    const title = requiredString(rawEvent, 'title', itemNumber);
    const person = optionalString(rawEvent.person) || familyNames.wife;
    const categoryValue = optionalString(rawEvent.category) || 'Other';
    const category = EVENT_CATEGORIES.includes(categoryValue as EventCategory)
      ? categoryValue as EventCategory
      : 'Other';
    const startDate = requiredString(rawEvent, 'startDate', itemNumber);
    const startTime = requiredString(rawEvent, 'startTime', itemNumber);
    const endDate = optionalString(rawEvent.endDate) || startDate;
    const endTime = requiredString(rawEvent, 'endTime', itemNumber);

    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
      throw new Error(`Event ${itemNumber}: dates must use YYYY-MM-DD.`);
    }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      throw new Error(`Event ${itemNumber}: times must use 24-hour HH:MM.`);
    }
    if (endDate < startDate) {
      throw new Error(`Event ${itemNumber}: endDate cannot be before startDate.`);
    }

    const isCallDuty = Boolean(rawEvent.isCallDuty) || category === 'On-Call 24h';

    return {
      id: `${idPrefix}-${Date.now()}-${index}`,
      title,
      person,
      category,
      startDate,
      startTime,
      endDate: isCallDuty ? startDate : endDate,
      endTime,
      isCallDuty,
      isNightShift: Boolean(rawEvent.isNightShift) || category === 'Night Shift',
      requiresPostCallRest: Boolean(rawEvent.requiresPostCallRest) || isCallDuty,
      location: optionalString(rawEvent.location),
      notes: optionalString(rawEvent.notes),
      source: 'wife_whatsapp',
    };
  });
};

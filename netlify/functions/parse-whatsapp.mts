import { GoogleGenAI, Type } from '@google/genai';

type FamilyNames = {
  husband?: string;
  wife?: string;
  child?: string;
};

type ParseRequest = {
  chatText?: string;
  referenceMonthYear?: string;
  familyNames?: FamilyNames;
};

type ParsedEvent = {
  title: string;
  person: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isCallDuty?: boolean;
  isNightShift?: boolean;
  requiresPostCallRest?: boolean;
  location?: string;
  notes?: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function eventResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      events: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            person: { type: Type.STRING },
            category: { type: Type.STRING },
            startDate: { type: Type.STRING },
            startTime: { type: Type.STRING },
            endDate: { type: Type.STRING },
            endTime: { type: Type.STRING },
            isCallDuty: { type: Type.BOOLEAN },
            isNightShift: { type: Type.BOOLEAN },
            requiresPostCallRest: { type: Type.BOOLEAN },
            location: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ['title', 'person', 'category', 'startDate', 'startTime', 'endDate', 'endTime'],
        },
      },
      summaryText: { type: Type.STRING },
    },
    required: ['events', 'summaryText'],
  };
}

function buildPrompt(chatText: string, referenceMonthYear: string, names: Required<FamilyNames>) {
  return `You are a family WhatsApp schedule parser.

Extract every calendar event from the chat for ${referenceMonthYear}. The family members are doctor husband ${names.husband}, lawyer wife ${names.wife}, and child ${names.child}.

Rules:
- Return dates as YYYY-MM-DD and times as 24-hour HH:MM.
- Use the person's exact configured name, or "Family" for shared events.
- Valid categories include On-Call 24h, Night Shift, Day Clinic, Post-Call Rest, Ward Rounds, Court Hearing, Late Night Call, Client Briefing, Nursery/Daycare, Pediatrician, Playgroup/Park, Family Outing, Date Night, Bedtime Routine, Church/Catechism, Custom Event, and Other.
- For a date range, create one event with the first and last date. For separately listed dates, create separate events.
- Doctor on-call duty uses category "On-Call 24h", starts at 08:00 unless stated, ends at 00:00 on the same date, and sets isCallDuty and requiresPostCallRest to true.
- Do not treat WhatsApp message timestamps as schedule events.
- Do not invent events that are not present in the chat.

WhatsApp chat:
${chatText}`;
}

function monthNumber(monthName: string) {
  const months: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10,
    october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  return months[monthName.toLowerCase()];
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractDates(line: string, referenceMonthYear: string) {
  const [referenceYearText, referenceMonthText] = referenceMonthYear.split('-');
  const referenceYear = Number(referenceYearText);
  const referenceMonth = Number(referenceMonthText);
  const dates: string[] = [];
  const isoPattern = /\b(\d{4}-\d{2}-\d{2})\b/g;
  const namedPattern = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi;
  const ordinalPattern = /\b(\d{1,2})(?:st|nd|rd|th)\b/g;
  let namedMonth: number | undefined;

  for (const match of line.matchAll(isoPattern)) dates.push(match[1]);
  for (const match of line.matchAll(namedPattern)) {
    const month = monthNumber(match[1]);
    const day = Number(match[2]);
    if (month && day >= 1 && day <= 31) {
      namedMonth ??= month;
      dates.push(formatDate(referenceYear, month, day));
    }
  }
  if (namedMonth) {
    for (const match of line.matchAll(/(?:,|\band\b)\s*(\d{1,2})(?:st|nd|rd|th)?(?=\s*(?:,|\band\b|$|:))/gi)) {
      const day = Number(match[1]);
      if (day >= 1 && day <= 31) dates.push(formatDate(referenceYear, namedMonth, day));
    }
  }
  if (dates.length === 0) {
    for (const match of line.matchAll(ordinalPattern)) {
      const day = Number(match[1]);
      if (day >= 1 && day <= 31) dates.push(formatDate(referenceYear, referenceMonth, day));
    }
  }

  return [...new Set(dates)];
}

function to24Hour(hourText: string, minuteText: string | undefined, meridiem: string | undefined) {
  let hour = Number(hourText);
  const minute = Number(minuteText || '0');
  if (meridiem?.toLowerCase() === 'pm' && hour < 12) hour += 12;
  if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function extractTimes(line: string, defaults: [string, string]) {
  const matches = [...line.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi)];
  if (matches.length === 0) return defaults;
  const start = to24Hour(matches[0][1], matches[0][2], matches[0][3]);
  const endMatch = matches[1];
  const end = endMatch ? to24Hour(endMatch[1], endMatch[2], endMatch[3]) : defaults[1];
  return [start, end] as [string, string];
}

function classifyLine(line: string, names: Required<FamilyNames>) {
  const lower = line.toLowerCase();
  if (/on[- ]?call|24h|hospital call|trauma duty/.test(lower)) {
    return { title: 'Hospital On-Call Duty', person: names.husband, category: 'On-Call 24h', defaults: ['08:00', '00:00'] as [string, string], isCallDuty: true, requiresPostCallRest: true };
  }
  if (/court|hearing|trial|arbitration/.test(lower)) {
    return { title: 'Court Hearing / Trial', person: names.wife, category: 'Court Hearing', defaults: ['09:00', '17:00'] as [string, string] };
  }
  if (/late call|client call|night brief|zoom call/.test(lower)) {
    return { title: 'Late Night Client Call', person: names.wife, category: 'Late Night Call', defaults: ['21:00', '23:00'] as [string, string], isNightShift: true };
  }
  if (/pediatrician|vaccin|doctor appointment/.test(lower)) {
    return { title: `${names.child} Pediatrician Appointment`, person: names.child, category: 'Pediatrician', defaults: ['09:00', '10:00'] as [string, string] };
  }
  if (/nursery|daycare|toddler camp/.test(lower)) {
    return { title: `${names.child} Nursery / Daycare`, person: names.child, category: 'Nursery/Daycare', defaults: ['08:30', '12:30'] as [string, string] };
  }
  if (/playgroup|little gym|park/.test(lower)) {
    return { title: `${names.child} Playgroup / Park`, person: names.child, category: 'Playgroup/Park', defaults: ['10:00', '12:00'] as [string, string] };
  }
  if (/church|mass|catechism/.test(lower)) {
    return { title: 'Church / Catechism', person: 'Family', category: 'Church/Catechism', defaults: ['09:00', '10:30'] as [string, string] };
  }
  if (/date night|dinner|family outing|brunch/.test(lower)) {
    return { title: 'Family Time', person: 'Family', category: 'Family Outing', defaults: ['18:00', '21:00'] as [string, string] };
  }
  return { title: 'Family Commitment', person: names.wife, category: 'Other', defaults: ['09:00', '17:00'] as [string, string] };
}

function parseLocally(chatText: string, referenceMonthYear: string, names: Required<FamilyNames>) {
  const events: ParsedEvent[] = [];
  const lines = chatText.split('\n').map((line) => line.replace(/^\[[^\]]+\]\s*[^:]+:\s*/, '').trim()).filter(Boolean);

  for (const line of lines) {
    const dates = extractDates(line, referenceMonthYear);
    if (dates.length === 0) continue;
    const classification = classifyLine(line, names);
    const [startTime, endTime] = extractTimes(line, classification.defaults);
    const isRange = /\b(?:to|through|until|-)\b/i.test(line) && dates.length >= 2;
    const eventDates = isRange ? [[dates[0], dates[dates.length - 1]]] : dates.map((date) => [date, date]);

    for (const [startDate, endDate] of eventDates) {
      events.push({
        title: classification.title,
        person: classification.person,
        category: classification.category,
        startDate,
        startTime,
        endDate: classification.isCallDuty ? startDate : endDate,
        endTime,
        isCallDuty: Boolean(classification.isCallDuty),
        isNightShift: Boolean(classification.isNightShift),
        requiresPostCallRest: Boolean(classification.requiresPostCallRest),
        location: '',
        notes: line,
      });
    }
  }

  return {
    events,
    summaryText: `Extracted ${events.length} event${events.length === 1 ? '' : 's'} with the local parser.`,
  };
}

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Use POST with a JSON request body.' }, 405);
  }

  let body: ParseRequest;
  try {
    body = await request.json() as ParseRequest;
  } catch {
    return jsonResponse({ success: false, error: 'The request body must be valid JSON.' }, 400);
  }

  const chatText = body.chatText?.trim();
  const referenceMonthYear = body.referenceMonthYear?.trim() || '2026-08';
  if (!chatText) return jsonResponse({ success: false, error: 'chatText is required.' }, 400);
  if (chatText.length > 100_000) return jsonResponse({ success: false, error: 'chatText must be 100,000 characters or fewer.' }, 413);
  if (!/^\d{4}-\d{2}$/.test(referenceMonthYear)) {
    return jsonResponse({ success: false, error: 'referenceMonthYear must use YYYY-MM.' }, 400);
  }

  const names: Required<FamilyNames> = {
    husband: body.familyNames?.husband?.trim() || 'Suren',
    wife: body.familyNames?.wife?.trim() || 'Nicole',
    child: body.familyNames?.child?.trim() || 'Gerard',
  };

  try {
    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: buildPrompt(chatText, referenceMonthYear, names),
      config: {
        responseMimeType: 'application/json',
        responseSchema: eventResponseSchema(),
        systemInstruction: 'Extract calendar events accurately from WhatsApp conversations.',
      },
    });
    if (!response.text) throw new Error('The AI parser returned an empty response.');
    return jsonResponse({ success: true, data: JSON.parse(response.text) });
  } catch (error) {
    console.warn('AI parsing failed; using local WhatsApp parser.', error instanceof Error ? error.message : error);
    const fallbackData = parseLocally(chatText, referenceMonthYear, names);
    if (fallbackData.events.length === 0) {
      return jsonResponse({ success: false, error: 'No schedule events with recognizable dates were found.', isFallback: true }, 422);
    }
    return jsonResponse({ success: true, data: fallbackData, isFallback: true });
  }
};

export const config = {
  path: '/api/parse-whatsapp',
  method: 'POST',
};

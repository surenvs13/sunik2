import type { Config } from '@netlify/functions';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { calendarEvents, calendarMetadata, type StoredScheduleEvent } from '../../db/schema.js';

const CALENDAR_ID = 'shared-family-calendar';

function isScheduleEvent(value: unknown): value is StoredScheduleEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return [
    'id',
    'title',
    'person',
    'category',
    'startDate',
    'startTime',
    'endDate',
    'endTime',
  ].every((key) => typeof event[key] === 'string');
}

function eventsDiffer(left: StoredScheduleEvent | undefined, right: StoredScheduleEvent) {
  return !left || JSON.stringify(left) !== JSON.stringify(right);
}

async function getCalendar() {
  const [metadata, rows] = await Promise.all([
    db.select().from(calendarMetadata).where(eq(calendarMetadata.id, CALENDAR_ID)).limit(1),
    db.select().from(calendarEvents),
  ]);

  return {
    initialized: metadata.length > 0,
    events: rows
      .map((row) => row.data)
      .sort((left, right) =>
        `${left.startDate}T${left.startTime}-${left.id}`.localeCompare(`${right.startDate}T${right.startTime}-${right.id}`),
      ),
    updatedAt: metadata[0]?.updatedAt?.toISOString() ?? null,
  };
}

export default async (request: Request) => {
  if (request.method === 'GET') {
    return Response.json(await getCalendar(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (request.method !== 'PUT') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: { baseEvents?: unknown; events?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.baseEvents) || !body.baseEvents.every(isScheduleEvent)) {
    return Response.json({ error: 'baseEvents must be a valid event array' }, { status: 400 });
  }
  if (!Array.isArray(body.events) || !body.events.every(isScheduleEvent)) {
    return Response.json({ error: 'events must be a valid event array' }, { status: 400 });
  }

  const baseEvents = body.baseEvents as StoredScheduleEvent[];
  const nextEvents = body.events as StoredScheduleEvent[];
  const baseById = new Map(baseEvents.map((event) => [event.id, event]));
  const nextIds = new Set(nextEvents.map((event) => event.id));
  const changedEvents = nextEvents.filter((event) => eventsDiffer(baseById.get(event.id), event));
  const deletedIds = baseEvents.filter((event) => !nextIds.has(event.id)).map((event) => event.id);
  const now = new Date();

  await db.transaction(async (transaction) => {
    if (deletedIds.length > 0) {
      await transaction.delete(calendarEvents).where(inArray(calendarEvents.id, deletedIds));
    }

    for (const event of changedEvents) {
      await transaction
        .insert(calendarEvents)
        .values({ id: event.id, data: event, updatedAt: now })
        .onConflictDoUpdate({
          target: calendarEvents.id,
          set: { data: event, updatedAt: now },
        });
    }

    await transaction
      .insert(calendarMetadata)
      .values({ id: CALENDAR_ID, updatedAt: now })
      .onConflictDoUpdate({
        target: calendarMetadata.id,
        set: { updatedAt: now },
      });
  });

  return Response.json(await getCalendar(), {
    headers: { 'Cache-Control': 'no-store' },
  });
};

export const config: Config = {
  path: '/api/calendar',
};

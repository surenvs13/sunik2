import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export type StoredScheduleEvent = {
  id: string;
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
  source?: 'doctor_roster' | 'wife_whatsapp' | 'manual' | 'ai_suggested';
};

export const calendarEvents = pgTable('calendar_events', {
  id: text('id').primaryKey(),
  data: jsonb('data').$type<StoredScheduleEvent>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const calendarMetadata = pgTable('calendar_metadata', {
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

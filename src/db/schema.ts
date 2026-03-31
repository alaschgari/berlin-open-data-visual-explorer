import { pgTable, text, integer, doublePrecision, numeric, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(),
  branch: text('branch'),
  top_branch: text('top_branch'),
  lor_id: text('lor_id'),
  employees: text('employees'),
  type: text('type'),
  age: text('age'),
  city: text('city'),
  postcode: text('postcode'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
});

export const businessByLor = pgTable('business_by_lor', {
  lor_id: text('lor_id').primaryKey(),
  data: jsonb('data'),
});

export const financialRecords = pgTable('financial_records', {
  id: integer('id').primaryKey(),
  year: integer('year').notNull(),
  district: text('district').notNull(),
  chapter: text('chapter').notNull(),
  title_code: text('title_code').notNull(),
  title: text('title'),
  budget: doublePrecision('budget').default(0),
  actual: doublePrecision('actual').default(0),
  diff: doublePrecision('diff').default(0),
  created_at: timestamp('created_at', { withTimezone: true }),
});

export const subsidies = pgTable('subsidies', {
  id: text('id').primaryKey(),
  recipient: text('recipient').notNull(),
  provider: text('provider').notNull(),
  type: text('type'),
  year: integer('year').notNull(),
  address: text('address'),
  area: text('area'),
  purpose: text('purpose'),
  amount: doublePrecision('amount').default(0),
  created_at: timestamp('created_at', { withTimezone: true }),
});

export const demographics = pgTable('demographics', {
  zeit: integer('zeit').primaryKey(),
  raumid: integer('raumid'),
  bez: integer('bez'),
  pgr: integer('pgr'),
  bzr: integer('bzr'),
  plr: integer('plr'),
  bezpgr: integer('bezpgr'),
  e_e: integer('e_e'),
  e_em: integer('e_em'),
  e_ew: integer('e_ew'),
  data: jsonb('data'), 
});

export const lorData = pgTable('lor_data', {
  id: text('id').primaryKey(),
  geometry: jsonb('geometry'),
  properties: jsonb('properties'),
});

export const markets = pgTable('markets', {
  id: text('id').primaryKey(),
  title: text('title'),
  geometry: jsonb('geometry'),
  properties: jsonb('properties'),
});

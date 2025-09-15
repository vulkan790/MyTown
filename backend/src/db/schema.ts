import { integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial().primaryKey().notNull(),

  email: text().notNull().unique(),

  password: text().notNull(),
  role: text().notNull(),

  firstName: text().notNull(),
  lastName: text().notNull(),
  middleName: text().notNull(),
  gender: text().notNull(),
  avatarUrl: text(),

  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
});

export const emailVerifications = pgTable('email_verifications', {
  id: serial().primaryKey().notNull(),
  email: text().notNull(),
  userId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
});

export const passwordResets = pgTable('password_resets', {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text().notNull(),
  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
  expiresAt: timestamp().notNull(),
});

export const problems = pgTable('problems', {
  id: serial().primaryKey().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  latitude: real().notNull(),
  longitude: real().notNull(),
  status: text().notNull(),
  userId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
});

export const problemImages = pgTable('problem_images', {
  id: serial().primaryKey().notNull(),
  imageUrl: text().notNull(),
  problemId: integer().references(() => problems.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
});

export const problemVotes = pgTable('problem_votes', {
  id: serial().primaryKey().notNull(),
  vote: integer().notNull(),
  problemId: integer().references(() => problems.id, { onDelete: 'cascade' }),
  voterId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
});

export const problemComments = pgTable('problem_comments', {
  id: serial().primaryKey().notNull(),
  content: text().notNull(),
  problemId: integer().references(() => problems.id, { onDelete: 'cascade' }),
  staffId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().$defaultFn(() => new Date()),
});

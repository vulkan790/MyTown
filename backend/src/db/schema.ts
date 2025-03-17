import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial().primaryKey().notNull(),

  phone: varchar({ length: 10 }),
  email: text().notNull().unique(),

  password: text().notNull(),
  role: text().notNull(),

  firstName: text().notNull(),
  lastName: text().notNull(),
  middleName: text(),
  gender: text().notNull(),
  avatarUrl: text(),

  createdAt: timestamp().defaultNow(),
});

export const emailVerifications = pgTable('email_verifications', {
  id: serial().primaryKey().notNull(),
  email: text().notNull(),
  userId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().defaultNow(),
});

export const phoneVerifications = pgTable('phone_verifications', {
  id: serial().primaryKey().notNull(),
  phone: text().notNull(),
  userId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().defaultNow(),
});

export const problems = pgTable('problems', {
  id: serial().primaryKey().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  address: text().notNull(),
  status: text().notNull(),
  userPriority: text().notNull(),
  townStaffPriority: text().notNull(),
  userId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().defaultNow(),
});

export const problemImages = pgTable('problem_images', {
  id: serial().primaryKey().notNull(),
  imageUrl: text().notNull(),
  problemId: integer().references(() => problems.id, { onDelete: 'cascade' }),
  createdAt: timestamp().defaultNow(),
});

export const problemVotes = pgTable('problem_votes', {
  id: serial().primaryKey().notNull(),
  problemId: integer().references(() => problems.id, { onDelete: 'cascade' }),
  voterId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().defaultNow(),
});

export const problemComments = pgTable('problem_comments', {
  id: serial().primaryKey().notNull(),
  content: text().notNull(),
  problemId: integer().references(() => problems.id, { onDelete: 'cascade' }),
  townStaffId: integer().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().defaultNow(),
});

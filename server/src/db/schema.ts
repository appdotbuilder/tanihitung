import { serial, text, pgTable, timestamp, numeric, integer, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const calculatorCategoryEnum = pgEnum('calculator_category', ['farming', 'livestock']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // In real implementation, this would be hashed
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Calculators table
export const calculatorsTable = pgTable('calculators', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  category: calculatorCategoryEnum('category').notNull(),
  unit_label: text('unit_label').notNull(),
  formula_key: text('formula_key').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Results table
export const resultsTable = pgTable('results', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  calculator_id: integer('calculator_id').notNull().references(() => calculatorsTable.id, { onDelete: 'cascade' }),
  input_json: json('input_json').notNull(), // Store calculation inputs as JSON
  result_value: numeric('result_value', { precision: 18, scale: 4 }).notNull(),
  unit_label: text('unit_label').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  results: many(resultsTable),
}));

export const calculatorsRelations = relations(calculatorsTable, ({ many }) => ({
  results: many(resultsTable),
}));

export const resultsRelations = relations(resultsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [resultsTable.user_id],
    references: [usersTable.id],
  }),
  calculator: one(calculatorsTable, {
    fields: [resultsTable.calculator_id],
    references: [calculatorsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Calculator = typeof calculatorsTable.$inferSelect;
export type NewCalculator = typeof calculatorsTable.$inferInsert;

export type Result = typeof resultsTable.$inferSelect;
export type NewResult = typeof resultsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  calculators: calculatorsTable,
  results: resultsTable,
};

export const tableRelations = {
  usersRelations,
  calculatorsRelations,
  resultsRelations,
};
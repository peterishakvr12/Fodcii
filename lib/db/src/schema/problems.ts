import { pgTable, serial, text, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const problemsTable = pgTable("problems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull().default("Algorithms"),
  level: integer("level").notNull().default(1),
  examples: jsonb("examples").notNull().default([]),
  constraints: jsonb("constraints").notNull().default([]),
  starterCode: jsonb("starter_code").notNull().default({}),
  submissionsCount: integer("submissions_count").notNull().default(0),
  acceptanceRate: numeric("acceptance_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProblemSchema = createInsertSchema(problemsTable).omit({
  id: true,
  createdAt: true,
  submissionsCount: true,
});

export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problemsTable.$inferSelect;

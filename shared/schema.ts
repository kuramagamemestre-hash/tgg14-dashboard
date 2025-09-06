import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bosses = pgTable("bosses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  location: text("location").notNull(),
  respawnTimeHours: integer("respawn_time_hours").notNull(),
  isAlive: boolean("is_alive").notNull().default(true),
  lastKilledAt: timestamp("last_killed_at"),
  lastKilledBy: text("last_killed_by"),
  iconType: text("icon_type").notNull().default("dragon"),
  iconColor: text("icon_color").notNull().default("red"),
  imageUrl: text("image_url"),
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  password: text("password").notNull(), // Senha individual do membro
  level: integer("level").notNull(),
  class: text("class").notNull(),
  poder: real("poder").notNull(),
  dkp: integer("dkp").notNull().default(0),
  role: text("role").notNull().default("Membro"), // Líder, Membro
  status: text("status").notNull().default("offline"), // online, offline, away
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // boss_killed, boss_spawned, member_joined, timer_set
  description: text("description").notNull(),
  bossId: varchar("boss_id").references(() => bosses.id),
  memberId: varchar("member_id").references(() => members.id),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdBy: varchar("created_by").notNull().references(() => members.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBossSchema = createInsertSchema(bosses).omit({
  id: true,
  lastKilledAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  joinedAt: true,
}).extend({
  class: z.enum(["ARQUEIRO", "GUERREIRO", "MAGO"]),
  role: z.enum(["Líder", "Vice Líder", "Membro"]),
  dkp: z.number().optional().default(0),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertBoss = z.infer<typeof insertBossSchema>;
export type Boss = typeof bosses.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

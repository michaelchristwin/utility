import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  decimal,
  date,
  numeric,
} from "drizzle-orm/pg-core";

type MeterType = "residential" | "commercial" | "industrial";
type PaymentStatus = "success" | "failed" | "pending";
type BillingStatus = "pending" | "paid" | "overdue";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password").notNull(),
  address: varchar("address", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bills: many(bills),
  meters: many(meters),
}));

export const meters = pgTable("meters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  meterNumber: varchar("meter_number").unique().notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<MeterType>(),
  installedAt: timestamp().defaultNow(),
});

export const metersRelations = relations(meters, ({ one, many }) => ({
  owner: one(users, { fields: [meters.userId], references: [users.id] }),
  bills: many(bills),
  meter_reading: many(meter_readings),
}));

export const meter_readings = pgTable("meter_readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  meterId: uuid("meter_id").notNull(),
  readingValue: decimal("reading_value").notNull(),
  readingTime: timestamp("reading_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tariffs = pgTable("tariffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  ratePerKwh: decimal("rate_per_kwh").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to").notNull(),
});

export const bills = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  meterId: uuid()
    .notNull()
    .references(() => meters.id),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  totalUsage: numeric("usage", { precision: 12, scale: 3 }).notNull(), // e.g. kWh
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().$type<BillingStatus>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // 'card', 'bank_transfer', 'wallet'
  status: varchar("status", { length: 20 }).notNull().$type<PaymentStatus>(),
});

// Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

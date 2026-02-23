import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  trialStartDate: timestamp("trialStartDate").defaultNow().notNull(),
  trialEndDate: timestamp("trialEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Subscriptions table for tracking user subscription status
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Listings table for scraped sales
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  saleDate: date("saleDate"),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  category: mysqlEnum("category", ["garage_sale", "yard_sale", "estate_sale", "multi_family_sale", "block_sale", "free_stuff", "other"]).notNull(),
  source: mysqlEnum("source", ["craigslist", "facebook", "estatesales", "user_submitted"]).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  aiCategory: varchar("aiCategory", { length: 100 }),
  aiSummary: text("aiSummary"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// User-submitted listings
export const userListings = mysqlTable("userListings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  saleDate: date("saleDate").notNull(),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  category: mysqlEnum("category", ["garage_sale", "yard_sale", "estate_sale", "multi_family_sale", "block_sale", "free_stuff", "other"]).notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserListing = typeof userListings.$inferSelect;
export type InsertUserListing = typeof userListings.$inferInsert;

// Saved routes
export const savedRoutes = mysqlTable("savedRoutes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  listingIds: json("listingIds").$type<number[]>().notNull(),
  optimizedOrder: json("optimizedOrder").$type<number[]>(),
  totalDistance: decimal("totalDistance", { precision: 10, scale: 2 }),
  estimatedTime: int("estimatedTime"), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedRoute = typeof savedRoutes.$inferSelect;
export type InsertSavedRoute = typeof savedRoutes.$inferInsert;

// Amenities cache
export const amenities = mysqlTable("amenities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["bathroom", "gas_station", "coffee_shop", "restaurant"]).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: varchar("address", { length: 500 }),
  osmId: varchar("osmId", { length: 100 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Amenity = typeof amenities.$inferSelect;
export type InsertAmenity = typeof amenities.$inferInsert;

// Scraper logs for audit trail
export const scraperLogs = mysqlTable("scraperLogs", {
  id: int("id").autoincrement().primaryKey(),
  source: mysqlEnum("source", ["craigslist", "facebook", "estatesales"]).notNull(),
  status: mysqlEnum("status", ["started", "completed", "failed"]).notNull(),
  listingsFound: int("listingsFound").default(0),
  listingsAdded: int("listingsAdded").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScraperLog = typeof scraperLogs.$inferSelect;
export type InsertScraperLog = typeof scraperLogs.$inferInsert;
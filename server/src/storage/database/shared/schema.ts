import { pgTable, serial, timestamp, unique, varchar, numeric, foreignKey, text, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	role: varchar({ length: 20 }).default('user'),
	status: varchar({ length: 20 }).default('active'),
	balance: numeric({ precision: 10, scale:  2 }).default('0.00'),
	deviceId: varchar("device_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_username_key").on(table.username),
]);

export const gameAccounts = pgTable("game_accounts", {
	id: serial().primaryKey().notNull(),
	gameName: varchar("game_name", { length: 100 }).notNull(),
	gameIcon: varchar("game_icon", { length: 500 }),
	accountName: varchar("account_name", { length: 100 }).notNull(),
	accountPassword: varchar("account_password", { length: 255 }).notNull(),
	serverName: varchar("server_name", { length: 100 }),
	rankInfo: varchar("rank_info", { length: 200 }),
	description: text(),
	pricePerHour: numeric("price_per_hour", { precision: 10, scale:  2 }).notNull(),
	deposit: numeric({ precision: 10, scale:  2 }).default('0.00'),
	status: varchar({ length: 20 }).default('available'),
	ownerId: integer("owner_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "game_accounts_owner_id_fkey"
		}),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	userId: integer("user_id"),
	accountId: integer("account_id"),
	status: varchar({ length: 20 }).default('pending'),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	durationHours: integer("duration_hours").notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
	securityStatus: varchar("security_status", { length: 20 }).default('normal'),
	riskScore: integer("risk_score").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_fkey"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [gameAccounts.id],
			name: "orders_account_id_fkey"
		}),
	unique("orders_order_no_key").on(table.orderNo),
]);

export const devices = pgTable("devices", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	deviceFingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
	deviceModel: varchar("device_model", { length: 100 }),
	osVersion: varchar("os_version", { length: 50 }),
	isRooted: boolean("is_rooted").default(false),
	isEmulator: boolean("is_emulator").default(false),
	hasOverlay: boolean("has_overlay").default(false),
	riskLevel: varchar("risk_level", { length: 20 }).default('low'),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "devices_user_id_fkey"
		}),
]);

export const securityLogs = pgTable("security_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	orderId: integer("order_id"),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	eventDesc: text("event_desc"),
	riskLevel: varchar("risk_level", { length: 20 }).default('low'),
	deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
	ipAddress: varchar("ip_address", { length: 50 }),
	actionTaken: varchar("action_taken", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

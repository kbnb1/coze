import { relations } from "drizzle-orm/relations";
import { users, gameAccounts, orders, devices } from "./schema";

export const gameAccountsRelations = relations(gameAccounts, ({one, many}) => ({
	user: one(users, {
		fields: [gameAccounts.ownerId],
		references: [users.id]
	}),
	orders: many(orders),
}));

export const usersRelations = relations(users, ({many}) => ({
	gameAccounts: many(gameAccounts),
	orders: many(orders),
	devices: many(devices),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	gameAccount: one(gameAccounts, {
		fields: [orders.accountId],
		references: [gameAccounts.id]
	}),
}));

export const devicesRelations = relations(devices, ({one}) => ({
	user: one(users, {
		fields: [devices.userId],
		references: [users.id]
	}),
}));
import { Table } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


export type Device = typeof devices.$inferInsert;

export const devices: Table = sqliteTable("devices", {
    id: integer("id").primaryKey(),
    title: text("name"),
    releaseYear: integer("release_year"),
});
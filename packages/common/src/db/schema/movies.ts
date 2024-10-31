import { Table } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


export type Movie = typeof movies.$inferInsert;

export const movies: Table = sqliteTable("movies", {
    id: integer("id").primaryKey(),
    title: text("name"),
    releaseYear: integer("release_year"),
});
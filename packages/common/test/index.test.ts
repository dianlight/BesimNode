import { expect, test, beforeAll, describe } from "bun:test";
import { initORM } from "../src/data-source.js";
import { movies, Movie } from "../src/db/schema/movies.js";
import { eq } from "drizzle-orm";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";


let db: BunSQLiteDatabase;

beforeAll(async () => {
    db = await initORM();
})

describe("Database", () => {
    test("Save New Entity", async () => {
        const movie: Movie = {
            releaseYear: 1999,
            title: "Test 1234"
        }
        const result = db.insert(movies).values(movie).returning();
        const r_movie = await result.execute();
        expect(r_movie).toBeDefined();
        expect(r_movie).toBeArrayOfSize(1);
        expect(r_movie[0]?.id).toBeGreaterThan(0);
    })
    test("Load Entity", async () => {

        const result = db.select().from(movies).where(eq(movies.title, 'Test 1234')).limit(1);
        const movie = await result.execute();
        expect(movie).toBeDefined();
        expect(movie).toBeArrayOfSize(1);
        expect(movie[0]?.id).toBe(1);
    })
});

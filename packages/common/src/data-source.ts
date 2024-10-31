import { BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';


export async function initORM(datafile = 'sqldata.db'): Promise<BunSQLiteDatabase> {
    const sqlite = new Database(datafile);
    const db = drizzle(sqlite, { casing: 'snake_case' });
    await migrate(db, { migrationsFolder: "./drizzle" });
    return db;
}


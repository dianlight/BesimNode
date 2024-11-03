import { expect, test, beforeAll, describe } from "bun:test";
import { initORM } from "../src/data-source.js";
import { devices } from "../src/db/schema/devices.ts";
import { rooms } from "../src/db/schema/rooms.ts";
import { eq } from "drizzle-orm";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { unlink } from "node:fs/promises";


let db: BunSQLiteDatabase;
const device_id = Math.trunc(Math.random() * 100000);
const room_id = Math.trunc(Math.random() * 100000);

beforeAll(async () => {
    await unlink("./sqldata.db");
    db = await initORM();
})

describe("Database", () => {
    test(`Save New Device ${device_id}`, async () => {
        const device: devices.$inferInsert = {
            name: "Test Device",
            device_id: device_id
        }
        const r_devices = await db.insert(devices).values(device).returning();
        expect(r_devices).toBeDefined();
        expect(r_devices).toBeArrayOfSize(1);
        expect(r_devices[0]?.device_id).toBe(device_id);
    })
    test(`Load DeviceEntity`, async () => {

        const device = await db.select().from(devices).where(eq(devices.name, 'Test Device')).limit(1);
        expect(device).toBeDefined();
        expect(device).toBeArrayOfSize(1);
        expect(device[0]?.device_id).toBe(device_id);
    })
    test(`Save New Room ${room_id}`, async () => {
        const room: rooms.$inferInsert = {
            name: "Test Room",
            device_id: device_id,
            room_id: room_id
        }
        const r_rooms = await db.insert(rooms).values(room).returning();
        expect(r_rooms).toBeDefined();
        expect(r_rooms).toBeArrayOfSize(1);
        expect(r_rooms[0]?.device_id).toBe(device_id);
        expect(r_rooms[0]?.room_id).toBe(room_id);

    })
    test(`Save New Room ${room_id + 1}`, async () => {
        const room: rooms.$inferInsert = {
            name: "Test Room 1",
            device_id: device_id,
            room_id: room_id + 1
        }
        const r_rooms = await db.insert(rooms).values(room).returning();
        expect(r_rooms).toBeDefined();
        expect(r_rooms).toBeArrayOfSize(1);
        expect(r_rooms[0]?.device_id).toBe(device_id);
        expect(r_rooms[0]?.room_id).toBe(room_id + 1);
    })
    test(`Load RoomEntity`, async () => {
        const room = await db.select().from(rooms).where(eq(rooms.name, 'Test Room')).limit(1);
        expect(room).toBeDefined();
        expect(room).toBeArrayOfSize(1);
        expect(room[0]?.device_id).toBe(device_id);
        expect(room[0]?.room_id).toBe(room_id);
    })
    test(`Query room by device_id ${device_id} and room_id ${room_id}`, async () => {
        const room = await db.select().from(rooms).where(eq(rooms.device_id, device_id)).where(eq(rooms.room_id, room_id)).limit(1);
        expect(room).toBeDefined();
        expect(room).toBeArrayOfSize(1);
        expect(room[0]?.device_id).toBe(device_id);
        expect(room[0]?.room_id).toBe(room_id);
    })
});

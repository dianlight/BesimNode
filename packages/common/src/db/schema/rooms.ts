import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { devices } from "./devices.ts";


export const rooms = sqliteTable("rooms", {
    room_id: integer("room_id").primaryKey(),
    device_id: integer("device_id").references(() => devices.device_id),
    name: text("name"),
    is_heating: integer("is_heating", { mode: 'boolean' }),
    mode: integer('mode'),
    temp: real('temp'),
    set_temp: real('set_temp'),
    t3: real('t3'),
    t2: real('t2'),
    t1: real('t1'),
    max_setpoint: integer('max_setpoint'),
    min_setpoint: integer('min_setpoint'),
    is_advance: integer('is_advance', { mode: 'boolean' }),
    is_unit_celsius: integer('is_unit_celsius', { mode: 'boolean' }),
    sensor_influence: integer('sensor_influence'),
    is_winter: integer('is_winter', { mode: 'boolean' }),
    is_cmd_issued: integer('is_cmd_issued', { mode: 'boolean' }),
    is_boost: integer('is_boost', { mode: 'boolean' }),
    temp_curve: integer('temp_curve'),
    heating_setpoint: integer('heating_setpoint'),
});
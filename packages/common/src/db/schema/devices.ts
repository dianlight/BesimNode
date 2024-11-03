import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


//export type Device = typeof devices.$inferInsert;

export const devices = sqliteTable("devices", {
    device_id: integer("device_id").primaryKey(),
    name: text("name"),
    // OpenTherm
    boiler_heating: integer("boiler_heating", { mode: 'boolean' }),
    dhw_mode: integer('dhw_mode', { mode: 'boolean' }),

    tSEt: integer("tSEt"),// set-point flow temperature calculated by the thermostat.
    tFLO: integer("tFLO"),// reading of the boiler flow sensor temperature.
    trEt: integer("trEt"),// reading of the boiler return sensor temperature.
    tdH: integer("tdH"),// reading of the boiler DHW sensor temperature.
    tFLU: integer("tFLU"),// reading of the boiler flues sensor temperature.
    tESt: integer("tESt"),// reading of the boiler outdoor sensor temperature (fitted to the boiler or communicated by the web).
    MOdU: integer("MOdU"),// instantaneous percentage of modulation of boiler fan.
    FLOr: integer("FLOr"),// instantaneous domestic hot water flow rate.
    HOUr: integer("HOUr"),// hours worked in high condensation mode.
    PrES: integer("PrES"),// central heating system pressure.
    tFL2: integer("tFL2"),// reading of the heating flow sensor on second circuit

    // Other
    wifi_signal: integer("wifi_signal"),
});
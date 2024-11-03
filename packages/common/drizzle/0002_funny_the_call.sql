ALTER TABLE `devices` RENAME COLUMN "id" TO "device_id";--> statement-breakpoint
CREATE TABLE `rooms` (
	`room_id` integer PRIMARY KEY NOT NULL,
	`device_id` integer,
	`name` text,
	`is_heating` integer,
	`mode` integer,
	`temp` real,
	`set_temp` real,
	`t3` real,
	`t2` real,
	`t1` real,
	`max_setpoint` integer,
	`min_setpoint` integer,
	`is_advance` integer,
	`is_unit_celsius` integer,
	`sensor_influence` integer,
	`is_winter` integer,
	`is_cmd_issued` integer,
	`is_boost` integer,
	`temp_curve` integer,
	`heating_setpoint` integer,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`device_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `movies`;--> statement-breakpoint
ALTER TABLE `devices` DROP COLUMN `release_year`;
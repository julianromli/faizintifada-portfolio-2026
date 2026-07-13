CREATE TABLE `speaking_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image` text NOT NULL,
	`title` text NOT NULL,
	`event_type` text DEFAULT 'offline' NOT NULL,
	`organizer` text,
	`location` text,
	`event_date` text,
	`audience_count` integer,
	`link` text,
	`featured` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);

CREATE TABLE `coaching_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`contact` text,
	`os` text NOT NULL,
	`ide` text NOT NULL,
	`ide_other` text,
	`experience` text NOT NULL,
	`about` text NOT NULL,
	`goal` text NOT NULL,
	`repo_url` text,
	`agreed_to_terms` integer NOT NULL,
	`created_at` integer NOT NULL
);

CREATE TABLE `coaching_testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`rating` integer NOT NULL,
	`experience` text NOT NULL,
	`outcome` text,
	`agreed_to_publish` integer NOT NULL,
	`created_at` integer NOT NULL
);

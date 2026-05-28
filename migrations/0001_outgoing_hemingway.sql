CREATE TABLE `testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`avatar` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`quote` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);

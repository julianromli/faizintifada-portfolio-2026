CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`mayar_ref` text,
	`created_at` integer NOT NULL,
	`paid_at` integer
);

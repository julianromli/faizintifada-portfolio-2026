ALTER TABLE `orders` ADD `name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `mobile` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `email_sent_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_mayar_ref_unique` ON `orders` (`mayar_ref`);
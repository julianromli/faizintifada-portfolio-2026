CREATE TABLE `page_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`avatar_image` text NOT NULL,
	`hero_image_top` text NOT NULL,
	`hero_image_middle` text NOT NULL,
	`hero_image_bottom` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`long_description` text NOT NULL,
	`image` text NOT NULL,
	`tags_json` text NOT NULL,
	`bg_class` text NOT NULL,
	`image_position` text,
	`client` text,
	`role` text,
	`timeline` text,
	`live_url` text,
	`images_json` text,
	`featured` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);
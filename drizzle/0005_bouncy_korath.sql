CREATE TABLE `adminLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetType` varchar(100),
	`targetId` int,
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraperConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('craigslist','facebook','ebay','nextdoor','estatesales') NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`runFrequency` varchar(50) DEFAULT 'hourly',
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`maxListingsPerRun` int DEFAULT 100,
	`timeout` int DEFAULT 300,
	`retryCount` int DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scraperConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `scraperConfig_source_unique` UNIQUE(`source`)
);
--> statement-breakpoint
CREATE TABLE `scraperJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('craigslist','facebook','ebay','nextdoor','estatesales') NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`region` varchar(255),
	`listingsFound` int DEFAULT 0,
	`listingsAdded` int DEFAULT 0,
	`listingsUpdated` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scraperJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `source` enum('craigslist','facebook','ebay','nextdoor','estatesales','user_submitted') NOT NULL;--> statement-breakpoint
ALTER TABLE `scraperLogs` MODIFY COLUMN `source` enum('craigslist','facebook','ebay','nextdoor','estatesales') NOT NULL;
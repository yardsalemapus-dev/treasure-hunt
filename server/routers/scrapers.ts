import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { scraperJobs, scraperConfig, scraperLogs, adminLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { CraigslistScraper } from "../scrapers/craigslistScraper";
import { FacebookScraper } from "../scrapers/facebookScraper";
import { EbayScraper, NextdoorScraper } from "../scrapers/ebayNextdoorScraper";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return next({ ctx });
});

// Get language-specific search terms for regional content
const getLanguageSpecificSearchTerms = (region: string) => {
  const regionMap: Record<string, { en: string[]; es: string[] }> = {
    nyc: {
      en: ["garage sale", "yard sale", "estate sale"],
      es: ["venta de garaje", "venta de patio", "venta de herencia"],
    },
    la: {
      en: ["garage sale", "yard sale", "estate sale"],
      es: ["venta de garaje", "venta de patio", "venta de herencia"],
    },
    sf: {
      en: ["garage sale", "yard sale", "estate sale"],
      es: ["venta de garaje", "venta de patio", "venta de herencia"],
    },
    miami: {
      en: ["garage sale", "yard sale", "estate sale"],
      es: ["venta de garaje", "venta de patio", "venta de herencia"],
    },
    austin: {
      en: ["garage sale", "yard sale", "estate sale"],
      es: ["venta de garaje", "venta de patio", "venta de herencia"],
    },
  };
  return regionMap[region] || regionMap["nyc"];
};

export const scrapersRouter = router({
  // Trigger a scraper manually
  triggerScraper: adminProcedure
    .input(
      z.object({
        source: z.enum(["craigslist", "facebook", "ebay", "nextdoor", "estatesales"]),
        region: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        let scraper: any;
        switch (input.source) {
          case "craigslist":
            scraper = new CraigslistScraper();
            break;
          case "facebook":
            scraper = new FacebookScraper();
            break;
          case "ebay":
            scraper = new EbayScraper();
            break;
          case "nextdoor":
            scraper = new NextdoorScraper();
            break;
          default:
            throw new Error("Unknown scraper source");
        }

        // Add language-specific search terms based on region
        const searchTerms = getLanguageSpecificSearchTerms(input.region || "nyc");
        const listings = await scraper.scrape(input.region || "nyc", searchTerms);

        // Log admin action
        await db.insert(adminLogs).values({
          adminId: ctx.user.id,
          action: "trigger_scraper",
          targetType: "scraper",
          details: {
            source: input.source,
            region: input.region,
            listingsFound: listings.length,
          },
          ipAddress: ctx.req.ip,
        });

        return {
          success: true,
          listingsFound: listings.length,
          message: `Scraper triggered for ${input.source} (English & Spanish content)`,
          languageSupport: "bilingual",
        };
      } catch (error) {
        console.error("Scraper trigger failed:", error);
        throw new Error("Failed to trigger scraper");
      }
    }),

  // Get scraper jobs
  getJobs: adminProcedure
    .input(
      z.object({
        source: z.enum(["craigslist", "facebook", "ebay", "nextdoor", "estatesales"]).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        let jobs: any[] = [];

        if (input.source) {
          jobs = await db
            .select()
            .from(scraperJobs)
            .where(eq(scraperJobs.source, input.source))
            .limit(input.limit);
        } else {
          jobs = await db.select().from(scraperJobs).limit(input.limit);
        }

        return jobs.map((job) => ({
          id: job.id,
          source: job.source,
          status: job.status,
          region: job.region,
          listingsFound: job.listingsFound,
          listingsAdded: job.listingsAdded,
          listingsUpdated: job.listingsUpdated,
          errorMessage: job.errorMessage,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          createdAt: job.createdAt,
        }));
      } catch (error) {
        console.error("Failed to get jobs:", error);
        throw new Error("Failed to get scraper jobs");
      }
    }),

  // Get scraper configuration
  getConfig: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      const configs = await db.select().from(scraperConfig);

      return configs.map((config) => ({
        id: config.id,
        source: config.source,
        isEnabled: config.isEnabled,
        runFrequency: config.runFrequency,
        lastRunAt: config.lastRunAt,
        nextRunAt: config.nextRunAt,
        maxListingsPerRun: config.maxListingsPerRun,
        timeout: config.timeout,
        retryCount: config.retryCount,
      }));
    } catch (error) {
      console.error("Failed to get config:", error);
      throw new Error("Failed to get scraper configuration");
    }
  }),

  // Update scraper configuration
  updateConfig: adminProcedure
    .input(
      z.object({
        source: z.enum(["craigslist", "facebook", "ebay", "nextdoor", "estatesales"]),
        isEnabled: z.boolean().optional(),
        runFrequency: z.string().optional(),
        maxListingsPerRun: z.number().optional(),
        timeout: z.number().optional(),
        retryCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const existing = await db
          .select()
          .from(scraperConfig)
          .where(eq(scraperConfig.source, input.source));

        if (existing.length === 0) {
          // Create new config
          await db.insert(scraperConfig).values({
            source: input.source,
            isEnabled: input.isEnabled ?? true,
            runFrequency: input.runFrequency,
            maxListingsPerRun: input.maxListingsPerRun,
            timeout: input.timeout,
            retryCount: input.retryCount,
          });
        } else {
          // Update existing config
          await db
            .update(scraperConfig)
            .set({
              isEnabled: input.isEnabled,
              runFrequency: input.runFrequency,
              maxListingsPerRun: input.maxListingsPerRun,
              timeout: input.timeout,
              retryCount: input.retryCount,
            })
            .where(eq(scraperConfig.source, input.source));
        }

        // Log admin action
        await db.insert(adminLogs).values({
          adminId: ctx.user.id,
          action: "update_scraper_config",
          targetType: "scraper_config",
          targetId: existing[0]?.id,
          details: input,
          ipAddress: ctx.req.ip,
        });

        return { success: true, message: "Configuration updated" };
      } catch (error) {
        console.error("Failed to update config:", error);
        throw new Error("Failed to update scraper configuration");
      }
    }),

  // Get scraper logs
  getLogs: adminProcedure
    .input(
      z.object({
        source: z.enum(["craigslist", "facebook", "ebay", "nextdoor", "estatesales"]).optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        let logs: any[] = [];

        if (input.source) {
          logs = await db
            .select()
            .from(scraperLogs)
            .where(eq(scraperLogs.source, input.source))
            .limit(input.limit);
        } else {
          logs = await db.select().from(scraperLogs).limit(input.limit);
        }

        return logs.map((log) => ({
          id: log.id,
          source: log.source,
          status: log.status,
          listingsFound: log.listingsFound,
          listingsAdded: log.listingsAdded,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        }));
      } catch (error) {
        console.error("Failed to get logs:", error);
        throw new Error("Failed to get scraper logs");
      }
    }),

  // Get scraper statistics
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      const jobs = await db.select().from(scraperJobs);
      const completedJobs = jobs.filter((j) => j.status === "completed");
      const failedJobs = jobs.filter((j) => j.status === "failed");

      const totalListingsFound = completedJobs.reduce((sum, j) => sum + (j.listingsFound || 0), 0);
      const totalListingsAdded = completedJobs.reduce((sum, j) => sum + (j.listingsAdded || 0), 0);

      return {
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        totalListingsFound,
        totalListingsAdded,
        successRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      throw new Error("Failed to get scraper statistics");
    }
  }),
});

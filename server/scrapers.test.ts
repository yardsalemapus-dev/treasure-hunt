import { describe, it, expect } from "vitest";
import { CraigslistScraper } from "./scrapers/craigslistScraper";
import { FacebookScraper } from "./scrapers/facebookScraper";
import { EbayScraper, NextdoorScraper } from "./scrapers/ebayNextdoorScraper";

describe("Scrapers", () => {
  describe("CraigslistScraper", () => {
    it("should initialize correctly", () => {
      const scraper = new CraigslistScraper();
      expect(scraper).toBeDefined();
    });

    it("should generate mock listings", async () => {
      const scraper = new CraigslistScraper();
      const listings = await scraper.scrape("nyc");
      expect(listings).toBeDefined();
      expect(Array.isArray(listings)).toBe(true);
    });
  });

  describe("FacebookScraper", () => {
    it("should initialize correctly", () => {
      const scraper = new FacebookScraper();
      expect(scraper).toBeDefined();
    });

    it("should generate mock listings", async () => {
      const scraper = new FacebookScraper();
      const listings = await scraper.scrape("sf");
      expect(listings).toBeDefined();
      expect(Array.isArray(listings)).toBe(true);
    });
  });

  describe("EbayScraper", () => {
    it("should initialize correctly", () => {
      const scraper = new EbayScraper();
      expect(scraper).toBeDefined();
    });

    it("should generate mock listings", async () => {
      const scraper = new EbayScraper();
      const listings = await scraper.scrape("la");
      expect(listings).toBeDefined();
      expect(Array.isArray(listings)).toBe(true);
    });
  });

  describe("NextdoorScraper", () => {
    it("should initialize correctly", () => {
      const scraper = new NextdoorScraper();
      expect(scraper).toBeDefined();
    });

    it("should generate mock listings", async () => {
      const scraper = new NextdoorScraper();
      const listings = await scraper.scrape("boston");
      expect(listings).toBeDefined();
      expect(Array.isArray(listings)).toBe(true);
    });
  });

  describe("Scraper Listings", () => {
    it("Craigslist listings should have required fields", async () => {
      const scraper = new CraigslistScraper();
      const listings = await scraper.scrape("nyc");

      if (listings.length > 0) {
        const listing = listings[0];
        expect(listing.title).toBeDefined();
        expect(listing.address).toBeDefined();
        expect(listing.latitude).toBeDefined();
        expect(listing.longitude).toBeDefined();
        expect(listing.source).toBe("craigslist");
        expect(listing.sourceUrl).toBeDefined();
      }
    });

    it("Facebook listings should have required fields", async () => {
      const scraper = new FacebookScraper();
      const listings = await scraper.scrape("sf");

      if (listings.length > 0) {
        const listing = listings[0];
        expect(listing.title).toBeDefined();
        expect(listing.address).toBeDefined();
        expect(listing.source).toBe("facebook");
      }
    });

    it("eBay listings should have required fields", async () => {
      const scraper = new EbayScraper();
      const listings = await scraper.scrape("la");

      if (listings.length > 0) {
        const listing = listings[0];
        expect(listing.title).toBeDefined();
        expect(listing.source).toBe("ebay");
      }
    });

    it("Nextdoor listings should have required fields", async () => {
      const scraper = new NextdoorScraper();
      const listings = await scraper.scrape("boston");

      if (listings.length > 0) {
        const listing = listings[0];
        expect(listing.title).toBeDefined();
        expect(listing.source).toBe("nextdoor");
      }
    });
  });
});

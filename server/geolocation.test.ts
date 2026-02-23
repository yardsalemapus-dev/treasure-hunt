import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  findNearestCraigslistArea,
  getAllCraigslistAreas,
  getCraigslistArea,
} from "./geolocation";

describe("Geolocation Utilities", () => {
  describe("calculateDistance", () => {
    it("should calculate distance between two coordinates", () => {
      // San Francisco to Los Angeles (approximately 347 miles)
      const distance = calculateDistance(
        37.7749, // SF latitude
        -122.4194, // SF longitude
        34.0522, // LA latitude
        -118.2437 // LA longitude
      );

      // Should be approximately 347 miles, allow 10 mile margin of error
      expect(distance).toBeGreaterThan(340);
      expect(distance).toBeLessThan(355);
    });

    it("should return 0 for same coordinates", () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });

    it("should handle short distances", () => {
      // Two points about 1 mile apart
      const distance = calculateDistance(
        37.7749,
        -122.4194,
        37.7849,
        -122.4194
      );

      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(2);
    });
  });

  describe("findNearestCraigslistArea", () => {
    it("should find nearest area to San Francisco", () => {
      const area = findNearestCraigslistArea(37.7749, -122.4194);
      expect(area.craigslistCode).toBe("sfbay");
    });

    it("should find nearest area to New York", () => {
      const area = findNearestCraigslistArea(40.7128, -74.006);
      expect(area.craigslistCode).toBe("nyc");
    });

    it("should find nearest area to Los Angeles", () => {
      const area = findNearestCraigslistArea(34.0522, -118.2437);
      expect(area.craigslistCode).toBe("la");
    });
  });

  describe("getAllCraigslistAreas", () => {
    it("should return array of all areas", () => {
      const areas = getAllCraigslistAreas();
      expect(Array.isArray(areas)).toBe(true);
      expect(areas.length).toBeGreaterThan(0);
    });

    it("should include major cities", () => {
      const areas = getAllCraigslistAreas();
      const codes = areas.map((a) => a.craigslistCode);

      expect(codes).toContain("sfbay");
      expect(codes).toContain("nyc");
      expect(codes).toContain("la");
      expect(codes).toContain("chi"); // Chicago uses 'chi' code
    });
  });

  describe("getCraigslistArea", () => {
    it("should return area by code", () => {
      const area = getCraigslistArea("sfbay");
      expect(area).not.toBeNull();
      expect(area?.name).toBe("San Francisco Bay Area");
    });

    it("should return null for invalid code", () => {
      const area = getCraigslistArea("invalid");
      expect(area).toBeNull();
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  clusterListings,
  getDistance,
  solveTSP,
  calculateRouteDistance,
  estimateRouteTime,
  getClusterCenter,
  generateOptimizedRoutes,
  Location,
} from "./services/routeOptimizer";

describe("Route Optimizer", () => {
  const mockListings: Location[] = [
    { id: 1, latitude: 40.7128, longitude: -74.006, title: "Sale 1" },
    { id: 2, latitude: 40.7138, longitude: -74.005, title: "Sale 2" },
    { id: 3, latitude: 40.7148, longitude: -74.004, title: "Sale 3" },
    { id: 4, latitude: 40.758, longitude: -73.9855, title: "Sale 4" },
    { id: 5, latitude: 40.768, longitude: -73.9855, title: "Sale 5" },
  ];

  describe("getDistance", () => {
    it("should calculate distance between two points", () => {
      // NYC to nearby location (roughly 0.1 miles)
      const distance = getDistance(40.7128, -74.006, 40.7138, -74.005);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(0.2); // Should be very close
    });

    it("should return 0 for same coordinates", () => {
      const distance = getDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it("should handle large distances", () => {
      // NYC to LA (roughly 2500 miles)
      const distance = getDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2600);
    });
  });

  describe("clusterListings", () => {
    it("should cluster nearby listings", () => {
      const clusters = clusterListings(mockListings, 0.5);
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.length).toBeLessThanOrEqual(mockListings.length);
    });

    it("should handle empty listings", () => {
      const clusters = clusterListings([], 2);
      expect(clusters).toEqual([]);
    });

    it("should handle single listing", () => {
      const clusters = clusterListings([mockListings[0]], 2);
      expect(clusters.length).toBe(1);
      expect(clusters[0]).toEqual([mockListings[0]]);
    });

    it("should respect cluster radius", () => {
      const tightClusters = clusterListings(mockListings, 0.1);
      const looseClusters = clusterListings(mockListings, 10);
      // Tighter radius should create more clusters
      expect(tightClusters.length).toBeGreaterThanOrEqual(looseClusters.length);
    });
  });

  describe("solveTSP", () => {
    it("should return empty array for empty locations", () => {
      const route = solveTSP([]);
      expect(route).toEqual([]);
    });

    it("should return single ID for single location", () => {
      const route = solveTSP([mockListings[0]]);
      expect(route).toEqual([1]);
    });

    it("should return route with all location IDs", () => {
      const route = solveTSP(mockListings.slice(0, 3));
      expect(route.length).toBe(3);
      expect(route).toContain(1);
      expect(route).toContain(2);
      expect(route).toContain(3);
    });

    it("should start from specified index", () => {
      const route = solveTSP(mockListings.slice(0, 3), 1);
      expect(route[0]).toBe(2); // Second listing (index 1)
    });
  });

  describe("calculateRouteDistance", () => {
    it("should return 0 for empty route", () => {
      const distance = calculateRouteDistance(mockListings, []);
      expect(distance).toBe(0);
    });

    it("should return 0 for single location", () => {
      const distance = calculateRouteDistance(mockListings, [1]);
      expect(distance).toBe(0);
    });

    it("should calculate positive distance for multiple locations", () => {
      const distance = calculateRouteDistance(mockListings.slice(0, 3), [1, 2, 3]);
      expect(distance).toBeGreaterThan(0);
    });

    it("should handle non-sequential routes", () => {
      const distance = calculateRouteDistance(mockListings.slice(0, 5), [1, 4, 2, 5, 3]);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe("estimateRouteTime", () => {
    it("should estimate time based on distance and stops", () => {
      const time = estimateRouteTime(5, 10); // 5 miles, 10 stops
      expect(time).toBeGreaterThan(0);
      // 5 miles at 25 mph = 12 minutes, plus 10 stops * 5 = 50 minutes = ~62 minutes
      expect(time).toBeGreaterThan(50);
    });

    it("should increase with more stops", () => {
      const time5Stops = estimateRouteTime(5, 5);
      const time10Stops = estimateRouteTime(5, 10);
      expect(time10Stops).toBeGreaterThan(time5Stops);
    });

    it("should increase with more distance", () => {
      const time5Miles = estimateRouteTime(5, 5);
      const time10Miles = estimateRouteTime(10, 5);
      expect(time10Miles).toBeGreaterThan(time5Miles);
    });
  });

  describe("getClusterCenter", () => {
    it("should return zero for empty cluster", () => {
      const center = getClusterCenter([]);
      expect(center).toEqual({ lat: 0, lng: 0 });
    });

    it("should return single point for single location", () => {
      const center = getClusterCenter([mockListings[0]]);
      expect(center.lat).toBe(40.7128);
      expect(center.lng).toBe(-74.006);
    });

    it("should calculate average for multiple locations", () => {
      const center = getClusterCenter(mockListings.slice(0, 2));
      expect(center.lat).toBeCloseTo((40.7128 + 40.7138) / 2, 4);
      expect(center.lng).toBeCloseTo((-74.006 + -74.005) / 2, 4);
    });
  });

  describe("generateOptimizedRoutes", () => {
    it("should return empty array for empty listings", () => {
      const routes = generateOptimizedRoutes([]);
      expect(routes).toEqual([]);
    });

    it("should generate at least one route", () => {
      const routes = generateOptimizedRoutes(mockListings);
      expect(routes.length).toBeGreaterThan(0);
    });

    it("should include all listings in routes", () => {
      const routes = generateOptimizedRoutes(mockListings);
      const allIds = routes.flatMap((r) => r.listingIds);
      expect(allIds.length).toBe(mockListings.length);
      mockListings.forEach((listing) => {
        expect(allIds).toContain(listing.id);
      });
    });

    it("should have valid route properties", () => {
      const routes = generateOptimizedRoutes(mockListings);
      routes.forEach((route) => {
        expect(route.clusterIndex).toBeGreaterThanOrEqual(0);
        expect(route.listingIds.length).toBeGreaterThan(0);
        expect(route.optimizedOrder.length).toBe(route.listingIds.length);
        expect(route.totalDistance).toBeGreaterThanOrEqual(0);
        expect(route.estimatedTime).toBeGreaterThan(0);
        expect(route.centerPoint.lat).toBeDefined();
        expect(route.centerPoint.lng).toBeDefined();
      });
    });

    it("should respect cluster radius parameter", () => {
      const tightRoutes = generateOptimizedRoutes(mockListings, 0.1);
      const looseRoutes = generateOptimizedRoutes(mockListings, 10);
      // Tighter radius should create more routes
      expect(tightRoutes.length).toBeGreaterThanOrEqual(looseRoutes.length);
    });
  });
});

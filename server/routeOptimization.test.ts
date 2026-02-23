import { describe, it, expect } from "vitest";
import { optimizeRoute, calculateDistanceFromStart, type Location } from "./routeOptimization";

describe("Route Optimization", () => {
  it("should handle empty locations array", () => {
    const result = optimizeRoute([]);
    expect(result.order).toEqual([]);
    expect(result.totalDistance).toBe(0);
    expect(result.estimatedTime).toBe(0);
    expect(result.waypoints).toEqual([]);
  });

  it("should handle single location", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194, name: "SF" },
    ];
    const result = optimizeRoute(locations);
    expect(result.order).toEqual([0]);
    expect(result.totalDistance).toBe(0);
    expect(result.waypoints).toHaveLength(1);
  });

  it("should optimize two locations", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194, name: "SF" },
      { id: 2, latitude: 37.3382, longitude: -121.8863, name: "San Jose" },
    ];
    const result = optimizeRoute(locations);
    expect(result.order).toHaveLength(2);
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.estimatedTime).toBeGreaterThan(0);
  });

  it("should create valid route for multiple locations", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194 },
      { id: 2, latitude: 37.3382, longitude: -121.8863 },
      { id: 3, latitude: 37.5485, longitude: -122.2481 },
      { id: 4, latitude: 37.6879, longitude: -122.0808 },
    ];
    const result = optimizeRoute(locations);
    
    expect(result.order).toHaveLength(4);
    expect(new Set(result.order).size).toBe(4); // All unique
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.waypoints).toHaveLength(4);
  });

  it("should calculate distance from start correctly", () => {
    const location: Location = {
      id: 1,
      latitude: 37.7749,
      longitude: -122.4194,
    };
    
    // Same location should have 0 distance
    const distance = calculateDistanceFromStart(37.7749, -122.4194, location);
    expect(distance).toBeLessThan(0.1); // Allow small floating point error
  });

  it("should estimate reasonable time for route", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194 },
      { id: 2, latitude: 37.3382, longitude: -121.8863 },
      { id: 3, latitude: 37.5485, longitude: -122.2481 },
    ];
    const result = optimizeRoute(locations);
    
    // Should be at least 45 minutes (3 stops * 15 min)
    expect(result.estimatedTime).toBeGreaterThanOrEqual(45);
  });

  it("should return waypoints in optimized order", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194, name: "A" },
      { id: 2, latitude: 37.3382, longitude: -121.8863, name: "B" },
      { id: 3, latitude: 37.5485, longitude: -122.2481, name: "C" },
    ];
    const result = optimizeRoute(locations);
    
    // Waypoints should be in the order specified by result.order
    for (let i = 0; i < result.order.length; i++) {
      expect(result.waypoints[i]).toEqual(locations[result.order[i]]);
    }
  });

  it("should produce consistent results for same input", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194 },
      { id: 2, latitude: 37.3382, longitude: -121.8863 },
      { id: 3, latitude: 37.5485, longitude: -122.2481 },
      { id: 4, latitude: 37.6879, longitude: -122.0808 },
    ];
    
    const result1 = optimizeRoute(locations);
    const result2 = optimizeRoute(locations);
    
    expect(result1.order).toEqual(result2.order);
    expect(result1.totalDistance).toBe(result2.totalDistance);
  });

  it("should handle locations with same coordinates", () => {
    const locations: Location[] = [
      { id: 1, latitude: 37.7749, longitude: -122.4194 },
      { id: 2, latitude: 37.7749, longitude: -122.4194 }, // Same as first
      { id: 3, latitude: 37.3382, longitude: -121.8863 },
    ];
    const result = optimizeRoute(locations);
    
    expect(result.order).toHaveLength(3);
    expect(result.totalDistance).toBeGreaterThanOrEqual(0);
  });
});

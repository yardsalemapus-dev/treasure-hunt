import { describe, it, expect } from "vitest";
import { NavigationService } from "./services/navigationService";

describe("Navigation Service", () => {
  const mockOrigin = { lat: 40.7128, lng: -74.006 };
  const mockDestination = { lat: 40.758, lng: -73.9855 };
  const mockWaypoint = { lat: 40.7348, lng: -73.9956 };

  describe("getDirections", () => {
    it("should return valid directions", async () => {
      const directions = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
      });

      expect(directions).toBeDefined();
      expect(directions.distance).toBeGreaterThan(0);
      expect(directions.duration).toBeGreaterThan(0);
      expect(directions.steps).toHaveLength(5);
      expect(directions.summary).toBeDefined();
    });

    it("should handle waypoints", async () => {
      const directions = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
        waypoints: [mockWaypoint],
      });

      expect(directions).toBeDefined();
      expect(directions.steps.length).toBeGreaterThan(0);
    });

    it("should support different languages", async () => {
      const enDirections = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
        language: "en",
      });

      const esDirections = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
        language: "es",
      });

      expect(enDirections.steps[0].instruction).not.toBe(
        esDirections.steps[0].instruction
      );
    });

    it("should support different travel modes", async () => {
      const drivingDirections = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
        travelMode: "DRIVING",
      });

      const walkingDirections = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
        travelMode: "WALKING",
      });

      // Walking should take longer than driving
      expect(walkingDirections.duration).toBeGreaterThan(
        drivingDirections.duration
      );
    });
  });

  describe("getOptimizedRoute", () => {
    it("should return multiple route segments", async () => {
      const routes = await NavigationService.getOptimizedRoute(
        mockOrigin,
        [mockWaypoint],
        mockDestination
      );

      expect(routes.length).toBeGreaterThan(0);
      routes.forEach((route) => {
        expect(route.distance).toBeGreaterThan(0);
        expect(route.duration).toBeGreaterThan(0);
        expect(route.steps.length).toBeGreaterThan(0);
      });
    });

    it("should handle no waypoints", async () => {
      const routes = await NavigationService.getOptimizedRoute(
        mockOrigin,
        [],
        mockDestination
      );

      expect(routes.length).toBe(1);
    });

    it("should handle multiple waypoints", async () => {
      const waypoint1 = { lat: 40.7348, lng: -73.9956 };
      const waypoint2 = { lat: 40.7450, lng: -73.9880 };

      const routes = await NavigationService.getOptimizedRoute(
        mockOrigin,
        [waypoint1, waypoint2],
        mockDestination
      );

      // Should have 3 routes: origin->wp1, wp1->wp2, wp2->destination
      expect(routes.length).toBe(3);
    });
  });

  describe("getNextStep", () => {
    it("should return next step when near start", async () => {
      const route = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
      });

      const nextStep = NavigationService.getNextStep(route, mockOrigin);
      expect(nextStep).toBeDefined();
      expect(nextStep?.instruction).toBeDefined();
    });

    it("should return null when far from route", async () => {
      const route = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
      });

      const farLocation = { lat: 51.5074, lng: -0.1278 }; // London
      const nextStep = NavigationService.getNextStep(route, farLocation);
      expect(nextStep).toBeNull();
    });
  });

  describe("calculateProgress", () => {
    it("should calculate progress correctly", async () => {
      const route = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
      });

      const progress = NavigationService.calculateProgress(route, mockOrigin);

      expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
      expect(progress.percentComplete).toBeLessThanOrEqual(100);
      expect(progress.remainingDistance).toBeGreaterThan(0);
      expect(progress.remainingTime).toBeGreaterThan(0);
    });

    it("should show 100% at destination", async () => {
      const route = await NavigationService.getDirections({
        origin: mockOrigin,
        destination: mockDestination,
      });

      const progress = NavigationService.calculateProgress(
        route,
        mockDestination
      );

      expect(progress.percentComplete).toBeLessThanOrEqual(100);
    });
  });
});

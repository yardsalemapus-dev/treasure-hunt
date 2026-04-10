import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { NavigationService } from "../services/navigationService";

export const navigationRouter = router({
  getDirections: publicProcedure
    .input(
      z.object({
        origin: z.object({ lat: z.number(), lng: z.number() }),
        destination: z.object({ lat: z.number(), lng: z.number() }),
        waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
        language: z.enum(["en", "es"]).default("en"),
      })
    )
    .query(async ({ input }) => {
      try {
        const routes = await NavigationService.getOptimizedRoute(
          input.origin,
          input.waypoints || [],
          input.destination
        );

        return {
          success: true,
          routes: routes.map((route) => ({
            summary: route.summary,
            distance: route.distance,
            duration: route.duration,
            steps: route.steps.map((step) => ({
              instruction: step.instruction,
              distance: step.distance,
              duration: step.duration,
              startLocation: step.startLocation,
              endLocation: step.endLocation,
              polyline: step.polyline,
              maneuver: step.maneuver,
            })),
            polyline: route.polyline,
            startAddress: route.startAddress,
            endAddress: route.endAddress,
            warnings: route.warnings,
          })),
        };
      } catch (error) {
        console.error("Failed to get directions:", error);
        return {
          success: false,
          routes: [],
          error: "Failed to get directions",
        };
      }
    }),

  getProgress: publicProcedure
    .input(
      z.object({
        route: z.object({
          distance: z.number(),
          duration: z.number(),
          steps: z.array(
            z.object({
              instruction: z.string(),
              distance: z.number(),
              duration: z.number(),
              startLocation: z.object({ lat: z.number(), lng: z.number() }),
              endLocation: z.object({ lat: z.number(), lng: z.number() }),
            })
          ),
        }),
        currentLocation: z.object({ lat: z.number(), lng: z.number() }),
      })
    )
    .query(({ input }) => {
      try {
        const progress = NavigationService.calculateProgress(input.route as any, input.currentLocation);

        return {
          success: true,
          ...progress,
        };
      } catch (error) {
        console.error("Failed to calculate progress:", error);
        return {
          success: false,
          percentComplete: 0,
          remainingDistance: 0,
          remainingTime: 0,
        };
      }
    }),

  getNextStep: publicProcedure
    .input(
      z.object({
        route: z.object({
          distance: z.number(),
          duration: z.number(),
          steps: z.array(
            z.object({
              instruction: z.string(),
              distance: z.number(),
              duration: z.number(),
              startLocation: z.object({ lat: z.number(), lng: z.number() }),
              endLocation: z.object({ lat: z.number(), lng: z.number() }),
            })
          ),
        }),
        currentLocation: z.object({ lat: z.number(), lng: z.number() }),
      })
    )
    .query(({ input }) => {
      try {
        const nextStep = NavigationService.getNextStep(input.route as any, input.currentLocation);

        return {
          success: true,
          step: nextStep,
        };
      } catch (error) {
        console.error("Failed to get next step:", error);
        return {
          success: false,
          step: null,
        };
      }
    }),
});

/**
 * Navigation Service - Turn-by-turn directions using Google Maps Directions API
 * Provides route navigation, step-by-step directions, and real-time guidance
 */

export interface NavigationStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  polyline: string;
  maneuver?: string;
}

export interface NavigationRoute {
  summary: string;
  distance: number; // meters
  duration: number; // seconds
  steps: NavigationStep[];
  polyline: string;
  startAddress: string;
  endAddress: string;
  warnings: string[];
}

export interface DirectionsRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
  travelMode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
  language?: string;
}

/**
 * Mock implementation of Directions API
 * In production, this would call Google Maps Directions API
 */
export class NavigationService {
  /**
   * Get directions between two points
   */
  static async getDirections(request: DirectionsRequest): Promise<NavigationRoute> {
    const { origin, destination, waypoints = [], travelMode = "DRIVING", language = "en" } = request;

    // Calculate approximate distance and duration
    const distance = this.calculateDistance(origin, destination);
    const duration = this.estimateDuration(distance, travelMode);

    // Generate mock steps
    const steps = this.generateSteps(origin, destination, waypoints, language);

    // Generate polyline (simplified)
    const polyline = this.generatePolyline(origin, destination);

    return {
      summary: `${this.formatDistance(distance)} (${this.formatDuration(duration)})`,
      distance,
      duration,
      steps,
      polyline,
      startAddress: `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`,
      endAddress: `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
      warnings: [],
    };
  }

  /**
   * Get directions for multiple waypoints (route optimization)
   */
  static async getOptimizedRoute(
    origin: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }>,
    destination: { lat: number; lng: number }
  ): Promise<NavigationRoute[]> {
    const routes: NavigationRoute[] = [];

    // Route from origin to first waypoint
    if (waypoints.length > 0) {
      routes.push(
        await this.getDirections({
          origin,
          destination: waypoints[0],
        })
      );

      // Routes between waypoints
      for (let i = 0; i < waypoints.length - 1; i++) {
        routes.push(
          await this.getDirections({
            origin: waypoints[i],
            destination: waypoints[i + 1],
          })
        );
      }

      // Route from last waypoint to destination
      routes.push(
        await this.getDirections({
          origin: waypoints[waypoints.length - 1],
          destination,
        })
      );
    } else {
      // Direct route if no waypoints
      routes.push(
        await this.getDirections({
          origin,
          destination,
        })
      );
    }

    return routes;
  }

  /**
   * Calculate haversine distance between two coordinates
   */
  private static calculateDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimate duration based on distance and travel mode
   */
  private static estimateDuration(distance: number, travelMode: string): number {
    // Average speeds (km/h)
    const speeds: Record<string, number> = {
      DRIVING: 40,
      WALKING: 5,
      BICYCLING: 15,
      TRANSIT: 25,
    };

    const speed = speeds[travelMode] || 40;
    return Math.round((distance / 1000 / speed) * 3600); // Convert to seconds
  }

  /**
   * Generate mock navigation steps
   */
  private static generateSteps(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }>,
    language: string
  ): NavigationStep[] {
    const steps: NavigationStep[] = [];
    const instructions: Record<string, string[]> = {
      en: [
        "Head north on Main Street",
        "Turn right onto Oak Avenue",
        "Continue on Oak Avenue",
        "Turn left onto Elm Street",
        "Arrive at destination on the right",
      ],
      es: [
        "Dirígete al norte por Main Street",
        "Gira a la derecha en Oak Avenue",
        "Continúa en Oak Avenue",
        "Gira a la izquierda en Elm Street",
        "Llega al destino a la derecha",
      ],
    };

    const instructionSet = instructions[language] || instructions["en"];
    const segmentDistance = this.calculateDistance(origin, destination) / instructionSet.length;

    let currentLat = origin.lat;
    let currentLng = origin.lng;
    const latStep = (destination.lat - origin.lat) / instructionSet.length;
    const lngStep = (destination.lng - origin.lng) / instructionSet.length;

    instructionSet.forEach((instruction, index) => {
      const nextLat = currentLat + latStep;
      const nextLng = currentLng + lngStep;

      steps.push({
        instruction,
        distance: segmentDistance,
        duration: Math.round(this.estimateDuration(segmentDistance, "DRIVING") / instructionSet.length),
        startLocation: { lat: currentLat, lng: currentLng },
        endLocation: { lat: nextLat, lng: nextLng },
        polyline: this.generatePolyline({ lat: currentLat, lng: currentLng }, { lat: nextLat, lng: nextLng }),
        maneuver: index === 0 ? "depart" : index === instructionSet.length - 1 ? "arrive" : "turn",
      });

      currentLat = nextLat;
      currentLng = nextLng;
    });

    return steps;
  }

  /**
   * Generate simplified polyline (base32 encoded path)
   */
  private static generatePolyline(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): string {
    // Simplified polyline format (not full base32 encoding, just a marker)
    return `polyline_${from.lat.toFixed(2)}_${from.lng.toFixed(2)}_${to.lat.toFixed(2)}_${to.lng.toFixed(2)}`;
  }

  /**
   * Format distance for display
   */
  private static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Convert degrees to radians
   */
  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Get next step based on current location
   */
  static getNextStep(route: NavigationRoute, currentLocation: { lat: number; lng: number }): NavigationStep | null {
    for (const step of route.steps) {
      const distance = this.calculateDistance(currentLocation, step.startLocation);
      if (distance < 100) {
        // Within 100 meters of step start
        return step;
      }
    }
    return null;
  }

  /**
   * Calculate progress along route
   */
  static calculateProgress(
    route: NavigationRoute,
    currentLocation: { lat: number; lng: number }
  ): { percentComplete: number; remainingDistance: number; remainingTime: number } {
    let totalDistanceCovered = 0;
    let currentStepIndex = 0;

    for (let i = 0; i < route.steps.length; i++) {
      const step = route.steps[i];
      const distanceToStep = this.calculateDistance(currentLocation, step.startLocation);

      if (distanceToStep < 100) {
        currentStepIndex = i;
        break;
      }
      totalDistanceCovered += step.distance;
    }

    const percentComplete = (totalDistanceCovered / route.distance) * 100;
    const remainingDistance = route.distance - totalDistanceCovered;
    const remainingTime = route.duration - Math.round((totalDistanceCovered / route.distance) * route.duration);

    return {
      percentComplete: Math.min(percentComplete, 100),
      remainingDistance,
      remainingTime,
    };
  }
}

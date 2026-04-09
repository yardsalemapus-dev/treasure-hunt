import { distance } from "@turf/distance";
import { point } from "@turf/helpers";

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  title?: string;
}

export interface OptimizedRoute {
  clusterIndex: number;
  listingIds: number[];
  optimizedOrder: number[];
  totalDistance: number; // in miles
  estimatedTime: number; // in minutes
  centerPoint: { lat: number; lng: number };
}

/**
 * Simple geographic clustering using distance-based grouping
 * Groups listings into clusters based on proximity threshold
 */
export function clusterListings(listings: Location[], clusterRadiusMiles: number = 2): Location[][] {
  if (listings.length === 0) return [];
  if (listings.length === 1) return [listings];

  const clusters: Location[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < listings.length; i++) {
    if (used.has(i)) continue;

    const cluster: Location[] = [listings[i]];
    used.add(i);

    // Find all listings within clusterRadiusMiles of this listing
    for (let j = i + 1; j < listings.length; j++) {
      if (used.has(j)) continue;

      const dist = getDistance(
        Number(listings[i].latitude),
        Number(listings[i].longitude),
        Number(listings[j].latitude),
        Number(listings[j].longitude)
      );

      if (dist <= clusterRadiusMiles) {
        cluster.push(listings[j]);
        used.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  try {
    const from = point([lng1, lat1]);
    const to = point([lng2, lat2]);
    return distance(from, to, { units: "miles" });
  } catch (error) {
    console.error("Distance calculation error:", error);
    return 0;
  }
}

/**
 * Solve Traveling Salesman Problem using nearest neighbor heuristic
 * Finds an efficient route through all locations
 */
export function solveTSP(locations: Location[], startIndex: number = 0): number[] {
  if (locations.length === 0) return [];
  if (locations.length === 1) return [locations[0].id];
  if (locations.length === 2) return [locations[0].id, locations[1].id];

  const route: number[] = [];
  const visited = new Set<number>();

  // Start from the given index
  let currentIndex = startIndex;
  route.push(locations[currentIndex].id);
  visited.add(currentIndex);

  // Nearest neighbor algorithm
  while (visited.size < locations.length) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    const current = locations[currentIndex];

    // Find nearest unvisited location
    for (let i = 0; i < locations.length; i++) {
      if (!visited.has(i)) {
        const candidate = locations[i];
        const dist = getDistance(
          Number(current.latitude),
          Number(current.longitude),
          Number(candidate.latitude),
          Number(candidate.longitude)
        );

        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex !== -1) {
      currentIndex = nearestIndex;
      route.push(locations[currentIndex].id);
      visited.add(nearestIndex);
    }
  }

  return route;
}

/**
 * Calculate total distance for a route
 */
export function calculateRouteDistance(locations: Location[], route: number[]): number {
  if (route.length < 2) return 0;

  let totalDistance = 0;
  const locationMap = new Map(locations.map((l) => [l.id, l]));

  for (let i = 0; i < route.length - 1; i++) {
    const current = locationMap.get(route[i]);
    const next = locationMap.get(route[i + 1]);

    if (current && next) {
      totalDistance += getDistance(
        Number(current.latitude),
        Number(current.longitude),
        Number(next.latitude),
        Number(next.longitude)
      );
    }
  }

  return totalDistance;
}

/**
 * Estimate time to complete route (5 min per stop + driving time)
 * Assumes average speed of 25 mph in urban areas
 */
export function estimateRouteTime(totalDistance: number, numStops: number): number {
  const drivingTime = (totalDistance / 25) * 60; // Convert to minutes
  const stopTime = numStops * 5; // 5 minutes per stop
  return Math.round(drivingTime + stopTime);
}

/**
 * Calculate cluster center point (centroid)
 */
export function getClusterCenter(locations: Location[]): { lat: number; lng: number } {
  if (locations.length === 0) return { lat: 0, lng: 0 };

  const avgLat = locations.reduce((sum, l) => sum + Number(l.latitude), 0) / locations.length;
  const avgLng = locations.reduce((sum, l) => sum + Number(l.longitude), 0) / locations.length;

  return { lat: avgLat, lng: avgLng };
}

/**
 * Generate optimized routes from a list of listings
 * Returns multiple routes, one per cluster
 */
export function generateOptimizedRoutes(listings: Location[], clusterRadiusMiles: number = 2): OptimizedRoute[] {
  const clusters = clusterListings(listings, clusterRadiusMiles);
  const routes: OptimizedRoute[] = [];

  clusters.forEach((cluster, clusterIndex) => {
    if (cluster.length === 0) return;

    // Solve TSP for this cluster
    const optimizedOrder = solveTSP(cluster);

    // Calculate metrics
    const totalDistance = calculateRouteDistance(cluster, optimizedOrder);
    const estimatedTime = estimateRouteTime(totalDistance, cluster.length);
    const centerPoint = getClusterCenter(cluster);

    routes.push({
      clusterIndex,
      listingIds: cluster.map((l) => l.id),
      optimizedOrder,
      totalDistance,
      estimatedTime,
      centerPoint,
    });
  });

  return routes;
}

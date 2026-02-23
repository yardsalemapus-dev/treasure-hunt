/**
 * Route Optimization Algorithm
 * Uses nearest neighbor heuristic with 2-opt local search improvement
 * Optimized for Traveling Salesman Problem (TSP)
 */

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  name?: string;
}

export interface OptimizedRoute {
  order: number[];
  totalDistance: number;
  estimatedTime: number; // in minutes
  waypoints: Location[];
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total distance for a given route order
 */
function calculateTotalDistance(locations: Location[], order: number[]): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const from = locations[order[i]];
    const to = locations[order[i + 1]];
    total += haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  }
  return total;
}

/**
 * Nearest Neighbor algorithm - fast heuristic for TSP
 * Starts from first location and always goes to nearest unvisited location
 */
function nearestNeighbor(locations: Location[]): number[] {
  if (locations.length === 0) return [];
  if (locations.length === 1) return [0];

  const visited = new Set<number>();
  const order: number[] = [0];
  visited.add(0);

  while (visited.size < locations.length) {
    const current = order[order.length - 1];
    let nearest = -1;
    let minDistance = Infinity;

    for (let i = 0; i < locations.length; i++) {
      if (!visited.has(i)) {
        const distance = haversineDistance(
          locations[current].latitude,
          locations[current].longitude,
          locations[i].latitude,
          locations[i].longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      }
    }

    if (nearest !== -1) {
      order.push(nearest);
      visited.add(nearest);
    }
  }

  return order;
}

/**
 * 2-opt local search improvement
 * Iteratively improves route by reversing segments
 */
function twoOptImprovement(locations: Location[], order: number[]): number[] {
  let improved = true;
  let currentOrder = [...order];

  while (improved) {
    improved = false;

    for (let i = 0; i < currentOrder.length - 2; i++) {
      for (let j = i + 2; j < currentOrder.length; j++) {
        // Calculate current distance
        const a = currentOrder[i];
        const b = currentOrder[i + 1];
        const c = currentOrder[j];
        const d = currentOrder[(j + 1) % currentOrder.length];

        const currentDist =
          haversineDistance(
            locations[a].latitude,
            locations[a].longitude,
            locations[b].latitude,
            locations[b].longitude
          ) +
          haversineDistance(
            locations[c].latitude,
            locations[c].longitude,
            locations[d].latitude,
            locations[d].longitude
          );

        // Calculate distance after 2-opt swap
        const newDist =
          haversineDistance(
            locations[a].latitude,
            locations[a].longitude,
            locations[c].latitude,
            locations[c].longitude
          ) +
          haversineDistance(
            locations[b].latitude,
            locations[b].longitude,
            locations[d].latitude,
            locations[d].longitude
          );

        // If improvement found, apply it
        if (newDist < currentDist) {
          // Reverse segment between i+1 and j
          const newOrder = [
            ...currentOrder.slice(0, i + 1),
            ...currentOrder.slice(i + 1, j + 1).reverse(),
            ...currentOrder.slice(j + 1),
          ];
          currentOrder = newOrder;
          improved = true;
        }
      }
    }
  }

  return currentOrder;
}

/**
 * Optimize route using nearest neighbor + 2-opt improvement
 * Returns optimized order and total distance
 */
export function optimizeRoute(locations: Location[]): OptimizedRoute {
  if (locations.length === 0) {
    return {
      order: [],
      totalDistance: 0,
      estimatedTime: 0,
      waypoints: [],
    };
  }

  if (locations.length === 1) {
    return {
      order: [0],
      totalDistance: 0,
      estimatedTime: 0,
      waypoints: locations,
    };
  }

  // Step 1: Get initial solution using nearest neighbor
  let order = nearestNeighbor(locations);

  // Step 2: Improve with 2-opt
  order = twoOptImprovement(locations, order);

  // Step 3: Calculate metrics
  const totalDistance = calculateTotalDistance(locations, order);
  
  // Estimate time: average 15 min per stop + 30 min per 10 miles travel
  const travelTime = (totalDistance / 10) * 30;
  const stopTime = locations.length * 15;
  const estimatedTime = Math.round(travelTime + stopTime);

  // Build waypoints in optimized order
  const waypoints = order.map((idx) => locations[idx]);

  return {
    order,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTime,
    waypoints,
  };
}

/**
 * Calculate distance between user location and first waypoint
 */
export function calculateDistanceFromStart(
  userLat: number,
  userLon: number,
  firstLocation: Location
): number {
  return haversineDistance(userLat, userLon, firstLocation.latitude, firstLocation.longitude);
}

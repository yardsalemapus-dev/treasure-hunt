import axios from "axios";

/**
 * Geolocation utilities for detecting user location and calculating distances
 */

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AreaCode {
  name: string;
  latitude: number;
  longitude: number;
  craigslistCode: string; // Craigslist area code (e.g., "sfbay", "nyc")
}

/**
 * Common Craigslist area codes and their coordinates
 */
const CRAIGSLIST_AREAS: Record<string, AreaCode> = {
  sfbay: {
    name: "San Francisco Bay Area",
    latitude: 37.7749,
    longitude: -122.4194,
    craigslistCode: "sfbay",
  },
  nyc: {
    name: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    craigslistCode: "nyc",
  },
  la: {
    name: "Los Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
    craigslistCode: "la",
  },
  chicago: {
    name: "Chicago",
    latitude: 41.8781,
    longitude: -87.6298,
    craigslistCode: "chi",
  },
  denver: {
    name: "Denver",
    latitude: 39.7392,
    longitude: -104.9903,
    craigslistCode: "denver",
  },
  seattle: {
    name: "Seattle",
    latitude: 47.6062,
    longitude: -122.3321,
    craigslistCode: "seattle",
  },
  miami: {
    name: "Miami",
    latitude: 25.7617,
    longitude: -80.1918,
    craigslistCode: "miami",
  },
  boston: {
    name: "Boston",
    latitude: 42.3601,
    longitude: -71.0589,
    craigslistCode: "boston",
  },
  philadelphia: {
    name: "Philadelphia",
    latitude: 39.9526,
    longitude: -75.1652,
    craigslistCode: "philly",
  },
  austin: {
    name: "Austin",
    latitude: 30.2672,
    longitude: -97.7431,
    craigslistCode: "austin",
  },
  dallas: {
    name: "Dallas",
    latitude: 32.7767,
    longitude: -96.797,
    craigslistCode: "dallas",
  },
  houston: {
    name: "Houston",
    latitude: 29.7604,
    longitude: -95.3698,
    craigslistCode: "houston",
  },
  phoenix: {
    name: "Phoenix",
    latitude: 33.4484,
    longitude: -112.074,
    craigslistCode: "phoenix",
  },
  portland: {
    name: "Portland",
    latitude: 45.5152,
    longitude: -122.6784,
    craigslistCode: "portland",
  },
  vegas: {
    name: "Las Vegas",
    latitude: 36.1699,
    longitude: -115.1398,
    craigslistCode: "vegas",
  },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
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
 * Find the nearest Craigslist area code to a given location
 */
export function findNearestCraigslistArea(
  latitude: number,
  longitude: number
): AreaCode {
  let nearest = Object.values(CRAIGSLIST_AREAS)[0];
  let minDistance = Infinity;

  for (const area of Object.values(CRAIGSLIST_AREAS)) {
    const distance = calculateDistance(
      latitude,
      longitude,
      area.latitude,
      area.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = area;
    }
  }

  return nearest;
}

/**
 * Reverse geocode coordinates to get address using OpenStreetMap Nominatim
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
        },
        headers: {
          "User-Agent": "TreasureHunt/1.0",
        },
        timeout: 5000,
      }
    );

    return response.data.address?.city || response.data.address?.county || null;
  } catch (error) {
    console.error("[Geolocation] Error reverse geocoding:", error);
    return null;
  }
}

/**
 * Get all available Craigslist areas
 */
export function getAllCraigslistAreas(): AreaCode[] {
  return Object.values(CRAIGSLIST_AREAS);
}

/**
 * Get a specific Craigslist area by code
 */
export function getCraigslistArea(code: string): AreaCode | null {
  return CRAIGSLIST_AREAS[code] || null;
}

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { trpc } from "../App";

export function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { data: nearbyListings = [], isLoading } = trpc.listings.getNearby.useQuery(
    location
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radiusMiles: 25,
        }
      : undefined,
    { enabled: !!location }
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      garage_sale: "#ef4444",
      yard_sale: "#f59e0b",
      estate_sale: "#10b981",
      multi_family_sale: "#3b82f6",
      block_sale: "#8b5cf6",
      free_stuff: "#ec4899",
      other: "#6b7280",
    };
    return colors[category] || "#6b7280";
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChange={setRegion}
      >
        {/* User location marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Nearby listings markers */}
        {nearbyListings.map((listing: any) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: parseFloat(listing.latitude),
              longitude: parseFloat(listing.longitude),
            }}
            title={listing.title}
            description={listing.address}
            pinColor={getCategoryColor(listing.category)}
          />
        ))}
      </MapView>

      {/* Sales count overlay */}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {nearbyListings.length} sales within 25 miles
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 12,
    borderRadius: 8,
  },
  overlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

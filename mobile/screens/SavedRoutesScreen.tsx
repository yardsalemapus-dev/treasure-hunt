import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { trpc } from "../App";

export function SavedRoutesScreen() {
  const { data: savedRoutes = [], isLoading } = trpc.routes.getSavedRoutes.useQuery();

  const deleteRoute = trpc.routes.deleteRoute.useMutation();

  const handleDelete = (routeId: number) => {
    deleteRoute.mutate({ routeId });
  };

  return (
    <View style={styles.container}>
      {savedRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved routes yet</Text>
          <Text style={styles.emptySubtext}>
            Create a route on the map and save it for later
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedRoutes}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.routeItem}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{item.name}</Text>
                <Text style={styles.routeDescription}>{item.description}</Text>
                <View style={styles.routeStats}>
                  <Text style={styles.stat}>
                    {item.listingIds?.length || 0} stops
                  </Text>
                  <Text style={styles.stat}>
                    {item.totalDistance} miles
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  routeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

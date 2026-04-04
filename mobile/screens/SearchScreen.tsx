import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { trpc } from "../App";

export function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: searchResults = [] } = trpc.search.search.useQuery(
    { query: searchQuery, categories: selectedCategories },
    { enabled: searchQuery.length > 0 }
  );

  const categories = [
    "garage_sale",
    "yard_sale",
    "estate_sale",
    "multi_family_sale",
    "block_sale",
    "free_stuff",
  ];

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by address or title..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Category filters */}
      <View style={styles.filterContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategories.includes(category) && styles.filterButtonActive,
            ]}
            onPress={() => toggleCategory(category)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategories.includes(category) && styles.filterTextActive,
              ]}
            >
              {category.replace(/_/g, " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultAddress}>{item.address}</Text>
            <Text style={styles.resultCategory}>{item.category.replace(/_/g, " ")}</Text>
          </View>
        )}
        ListEmptyComponent={
          searchQuery ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : (
            <Text style={styles.emptyText}>Start typing to search</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
});

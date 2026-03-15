import { useSearch } from "@/context/SearchContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours, supabase } from "@kiado/shared";
import { Amenity } from "@kiado/shared/types/property";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function ActiveSearchFilters() {
  const [amenityMap, setAmenityMap] = useState<Record<string, Amenity>>({});
  const { searchParams, updateSearchParams, hasActiveFilters } = useSearch();

  // Load amenity details so we can show dismissible chips for active filters
  useEffect(() => {
    supabase
      .from("amenities")
      .select("*")
      .then(({ data }) => {
        const map: Record<string, Amenity> = {};
        (data || []).forEach((a: Amenity) => (map[a.id] = a));
        setAmenityMap(map);
      });
  }, []);

  const removeAmenityFilter = (id: string) => {
    updateSearchParams({
      amenityIds: searchParams.amenityIds.filter((a) => a !== id),
    });
  };

  return (
    <>
      {/* Active filter chips */}
      {hasActiveFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersRow}
        >
          {searchParams.minBedrooms !== null && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => updateSearchParams({ minBedrooms: null })}
            >
              <Text style={styles.activeChipText}>
                {searchParams.minBedrooms}+ beds
              </Text>
              <MaterialIcons name="close" size={14} color={colours.primary} />
            </TouchableOpacity>
          )}
          {searchParams.minPrice !== null && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => updateSearchParams({ minPrice: null })}
            >
              <Text style={styles.activeChipText}>
                From £{searchParams.minPrice}
              </Text>
              <MaterialIcons name="close" size={14} color={colours.primary} />
            </TouchableOpacity>
          )}
          {searchParams.maxPrice !== null && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => updateSearchParams({ maxPrice: null })}
            >
              <Text style={styles.activeChipText}>
                Up to £{searchParams.maxPrice}
              </Text>
              <MaterialIcons name="close" size={14} color={colours.primary} />
            </TouchableOpacity>
          )}
          {searchParams.amenityIds.map((id) =>
            amenityMap[id] ? (
              <TouchableOpacity
                key={id}
                style={styles.activeChip}
                onPress={() => removeAmenityFilter(id)}
              >
                <MaterialIcons
                  name={amenityMap[id].icon as any}
                  size={14}
                  color={colours.primary}
                />
                <Text style={styles.activeChipText}>{amenityMap[id].name}</Text>
                <MaterialIcons name="close" size={14} color={colours.primary} />
              </TouchableOpacity>
            ) : null,
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  activeFiltersRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colours.primaryLight,
    borderWidth: 1,
    borderColor: colours.primary + "40",
  },
  activeChipText: {
    fontSize: 12,
    color: colours.primary,
    fontWeight: "600",
  },
});

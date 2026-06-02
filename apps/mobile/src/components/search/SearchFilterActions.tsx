import { useMemo } from "react";
import { useSearch } from "@/context/SearchContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import SearchFilters from "./SearchFilters";
import { useState } from "react";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

export default function SearchFilterActions() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const { searchParams, updateSearchParams, hasActiveFilters, clearFilters } =
    useSearch();

  const activeFilterCount =
    searchParams.amenityIds.length +
    (searchParams.minBedrooms !== null ? 1 : 0) +
    (searchParams.minPrice !== null ? 1 : 0) +
    (searchParams.maxPrice !== null ? 1 : 0);

  return (
    <>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setFiltersVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="tune"
            size={16}
            color={activeFilterCount > 0 ? "#fff" : theme.primary}
          />
          <Text
            style={[
              styles.filterButtonText,
              activeFilterCount > 0 && styles.filterButtonTextActive,
            ]}
          >
            {activeFilterCount > 0
              ? `Filters (${activeFilterCount})`
              : "Filters"}
          </Text>
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <MaterialIcons
              name="close"
              size={14}
              color={theme.textSecondary}
            />
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <SearchFilters
        visible={filtersVisible}
        params={searchParams}
        onApply={updateSearchParams}
        onClose={() => setFiltersVisible(false)}
      />
    </>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    actionsRow: {
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: t.primary,
      backgroundColor: t.surface,
    },
    filterButtonActive: {
      backgroundColor: t.primary,
      borderColor: t.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: t.primary,
    },
    filterButtonTextActive: {
      color: "#fff",
    },
    clearFiltersButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    clearFiltersText: {
      fontSize: 13,
      color: t.textSecondary,
      fontWeight: "500",
    },
  });
}

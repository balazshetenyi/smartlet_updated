import { useMemo } from "react";
import { useSearch } from "@/context/SearchContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

type SearchSummaryProps = { resultCount: number; locationLabel: string };

export default function SearchSummary({
  resultCount,
  locationLabel,
}: SearchSummaryProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { searchParams } = useSearch();

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.resultsCount}>
        {resultCount}{" "}
        <Text style={styles.resultsCountLabel}>
          {resultCount === 1 ? "property" : "properties"} found
        </Text>
      </Text>
      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={13} color={theme.primary} />
        <Text style={styles.searchLocation} numberOfLines={1}>
          {locationLabel}
        </Text>
      </View>
      {searchParams.checkIn && (
        <View style={styles.locationRow}>
          <MaterialIcons
            name="date-range"
            size={13}
            color={theme.textSecondary}
          />
          <Text style={styles.searchDates}>
            {new Date(searchParams.checkIn).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            →{" "}
            {new Date(searchParams.checkOut!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    summaryRow: {
      flex: 1,
      gap: 3,
    },
    resultsCount: {
      fontSize: 22,
      fontWeight: "800",
      color: t.text,
    },
    resultsCountLabel: {
      fontSize: 18,
      fontWeight: "500",
      color: t.text,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    searchLocation: {
      fontSize: 13,
      color: t.textSecondary,
      flex: 1,
    },
    searchDates: {
      fontSize: 13,
      color: t.textSecondary,
    },
  });
}

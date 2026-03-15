import { colours, supabase } from "@kiado/shared";
import { Amenity } from "@kiado/shared/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchParams } from "@/context/SearchContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

type Props = {
  visible: boolean;
  params: SearchParams;
  onApply: (updates: Partial<SearchParams>) => void;
  onClose: () => void;
};

const BEDROOM_OPTIONS = [null, 1, 2, 3, 4, 5];

export default function SearchFilters({
  visible,
  params,
  onApply,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Local draft state — only committed on Apply
  const [amenityIds, setAmenityIds] = useState<string[]>(params.amenityIds);
  const [minBedrooms, setMinBedrooms] = useState<number | null>(
    params.minBedrooms,
  );
  const [minPrice, setMinPrice] = useState<number | null>(params.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | null>(params.maxPrice);

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);

  // Sync draft when sheet opens
  useEffect(() => {
    if (visible) {
      setAmenityIds(params.amenityIds);
      setMinBedrooms(params.minBedrooms);
      setMinPrice(params.minPrice);
      setMaxPrice(params.maxPrice);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    supabase
      .from("amenities")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setAmenities(data || []);
        setLoadingAmenities(false);
      });
  }, []);

  const toggleAmenity = (id: string) => {
    setAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleApply = () => {
    onApply({ amenityIds, minBedrooms, minPrice, maxPrice });
    onClose();
  };

  const handleReset = () => {
    setAmenityIds([]);
    setMinBedrooms(null);
    setMinPrice(null);
    setMaxPrice(null);
  };

  const activeCount =
    amenityIds.length +
    (minBedrooms !== null ? 1 : 0) +
    (minPrice !== null ? 1 : 0) +
    (maxPrice !== null ? 1 : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset} disabled={activeCount === 0}>
            <Text
              style={[
                styles.resetText,
                activeCount === 0 && styles.resetDisabled,
              ]}
            >
              Reset
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colours.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Bedrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Bedrooms</Text>
            <View style={styles.chipRow}>
              {BEDROOM_OPTIONS.map((val) => {
                const isSelected = minBedrooms === val;
                return (
                  <TouchableOpacity
                    key={String(val)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setMinBedrooms(val)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {val === null ? "Any" : `${val}+`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range (per night)</Text>
            <View style={styles.priceRow}>
              {[null, 50, 100, 150, 200].map((val) => {
                const isSelected = minPrice === val;
                return (
                  <TouchableOpacity
                    key={`min-${val}`}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setMinPrice(val)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {val === null ? "Any" : `£${val}+`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.subLabel}>Max price</Text>
            <View style={styles.priceRow}>
              {[null, 100, 200, 500, 1000].map((val) => {
                const isSelected = maxPrice === val;
                return (
                  <TouchableOpacity
                    key={`max-${val}`}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setMaxPrice(val)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {val === null ? "Any" : `£${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            {loadingAmenities ? (
              <ActivityIndicator color={colours.primary} />
            ) : (
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity) => {
                  const isSelected = amenityIds.includes(amenity.id);
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      style={[
                        styles.amenityChip,
                        isSelected && styles.amenityChipSelected,
                      ]}
                      onPress={() => toggleAmenity(amenity.id)}
                    >
                      <MaterialIcons
                        name={amenity.icon as any}
                        size={18}
                        color={
                          isSelected ? colours.primary : colours.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.amenityText,
                          isSelected && styles.amenityTextSelected,
                        ]}
                      >
                        {amenity.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Apply button */}
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyText}>
            Show results
            {activeCount > 0
              ? ` (${activeCount} filter${activeCount > 1 ? "s" : ""})`
              : ""}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colours.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colours.text,
  },
  resetText: {
    fontSize: 15,
    color: colours.primary,
    fontWeight: "500",
  },
  resetDisabled: {
    color: colours.muted,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 14,
  },
  subLabel: {
    fontSize: 13,
    color: colours.textSecondary,
    marginTop: 12,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginHorizontal: 20,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  chipSelected: {
    borderColor: colours.primary,
    backgroundColor: colours.primaryLight,
  },
  chipText: {
    fontSize: 14,
    color: colours.textSecondary,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: colours.primary,
    fontWeight: "600",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  amenityChipSelected: {
    borderColor: colours.primary,
    backgroundColor: colours.primaryLight,
  },
  amenityText: {
    fontSize: 13,
    color: colours.textSecondary,
    fontWeight: "500",
  },
  amenityTextSelected: {
    color: colours.primary,
    fontWeight: "600",
  },
  applyButton: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colours.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

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
import RangeSlider from "react-native-fast-range-slider";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

// 40px total horizontal padding in the section (20px each side)
const SLIDER_WIDTH = SCREEN_WIDTH - 40;

/** Exported so ActiveSearchFilters can reference the same sentinels. */
export const PRICE_MIN = 0;
export const PRICE_MAX = 1000;
export const PRICE_STEP = 10;

type Props = {
  visible: boolean;
  params: SearchParams;
  onApply: (updates: Partial<SearchParams>) => void;
  onClose: () => void;
};

const BEDROOM_OPTIONS = [null, 1, 2, 3, 4, 5];

function buildPriceLabel(lo: number, hi: number): string {
  const atMin = lo <= PRICE_MIN;
  const atMax = hi >= PRICE_MAX;
  if (atMin && atMax) return "Any price";
  if (atMin) return `Up to £${hi}`;
  if (atMax) return `£${lo}+`;
  return `£${lo} – £${hi}`;
}

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
  const [sliderMin, setSliderMin] = useState<number>(
    params.minPrice ?? PRICE_MIN,
  );
  const [sliderMax, setSliderMax] = useState<number>(
    params.maxPrice ?? PRICE_MAX,
  );

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);

  // Sync draft when sheet opens
  useEffect(() => {
    if (visible) {
      setAmenityIds(params.amenityIds);
      setMinBedrooms(params.minBedrooms);
      setSliderMin(params.minPrice ?? PRICE_MIN);
      setSliderMax(params.maxPrice ?? PRICE_MAX);
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
    onApply({
      amenityIds,
      minBedrooms,
      minPrice: sliderMin > PRICE_MIN ? sliderMin : null,
      maxPrice: sliderMax < PRICE_MAX ? sliderMax : null,
    });
    onClose();
  };

  const handleReset = () => {
    setAmenityIds([]);
    setMinBedrooms(null);
    setSliderMin(PRICE_MIN);
    setSliderMax(PRICE_MAX);
  };

  const priceFiltered = sliderMin > PRICE_MIN || sliderMax < PRICE_MAX;
  const activeCount =
    amenityIds.length +
    (minBedrooms !== null ? 1 : 0) +
    (priceFiltered ? 1 : 0);

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

          {/* Price range — single two-thumb slider */}
          <View style={styles.section}>
            <View style={styles.priceHeader}>
              <Text style={styles.sectionTitle}>
                {params.rentalType === "short_term"
                  ? "Price per week"
                  : "Price per night"}
              </Text>
              <Text
                style={[
                  styles.priceLabel,
                  priceFiltered && styles.priceLabelActive,
                ]}
              >
                {buildPriceLabel(sliderMin, sliderMax)}
              </Text>
            </View>

            <RangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              initialMinValue={sliderMin}
              initialMaxValue={sliderMax}
              width={SLIDER_WIDTH}
              thumbSize={28}
              trackHeight={4}
              selectedTrackColor={colours.primary}
              selectedTrackStyle={{ backgroundColor: colours.primary }}
              unselectedTrackStyle={{ backgroundColor: colours.border }}
              thumbStyle={{
                backgroundColor: colours.surface,
                borderWidth: 2,
                borderColor: colours.primary,
              }}
              pressedThumbStyle={{ transform: [{ scale: 1.15 }] }}
              showThumbLines={false}
              minimumDistance={PRICE_STEP}
              onValuesChange={([lo, hi]) => {
                setSliderMin(lo);
                setSliderMax(hi);
              }}
              leftThumbAccessibilityLabel="Minimum price"
              rightThumbAccessibilityLabel="Maximum price"
            />

            <View style={styles.sliderLegend}>
              <Text style={styles.sliderLegendText}>£{PRICE_MIN}</Text>
              <Text style={styles.sliderLegendText}>£{PRICE_MAX}+</Text>
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
  // Bedroom badges
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
  // Price sliders
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.textSecondary,
  },
  priceLabelActive: {
    color: colours.primary,
  },
  sliderLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sliderLegendText: {
    fontSize: 11,
    color: colours.muted,
  },
  // Amenities
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

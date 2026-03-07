import { useSearch } from "@/context/SearchContext";
import LocationAutocomplete from "@/components/search/LocationAutocomplete";
import { PropertyType, RentalType } from "@/enums/property-enums";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours } from "@kiado/shared";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Calendar } from "react-native-calendars";

const RENTAL_TYPES = [
  PropertyType.Any,
  PropertyType.ShortTerm,
  PropertyType.Holiday,
];

const RADIUS_OPTIONS = [5, 15, 30, 50, 100] as const;

export default function SearchBar() {
  const { searchParams, updateSearchParams } = useSearch();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [tempDates, setTempDates] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
  });
  const [tempGuests, setTempGuests] = useState(searchParams.guests);
  const [tempMinPrice, setTempMinPrice] = useState<string>(
    searchParams.minPrice ? String(searchParams.minPrice) : "",
  );
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(
    searchParams.maxPrice ? String(searchParams.maxPrice) : "",
  );
  const [tempRentalType, setTempRentalType] = useState<string>(
    searchParams.rentalType ?? "Any",
  );

  const handleSearch = (event: any) => {
    event.preventDefault();
    router.push("/properties/search");
  };

  const handleDatePress = (day: any) => {
    const dateString = day.dateString;

    if (!tempDates.checkIn || (tempDates.checkIn && tempDates.checkOut)) {
      setTempDates({ checkIn: dateString, checkOut: null });
    } else {
      if (new Date(dateString) < new Date(tempDates.checkIn)) {
        setTempDates({ checkIn: dateString, checkOut: tempDates.checkIn });
      } else {
        setTempDates({ ...tempDates, checkOut: dateString });
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (tempDates.checkIn) {
      marked[tempDates.checkIn] = {
        startingDay: true,
        color: colours.primary,
        textColor: "white",
      };

      if (tempDates.checkOut) {
        const start = new Date(tempDates.checkIn);
        const end = new Date(tempDates.checkOut);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateString = d.toISOString().split("T")[0];

          if (dateString === tempDates.checkIn) continue;
          if (dateString === tempDates.checkOut) {
            marked[dateString] = {
              endingDay: true,
              color: colours.primary,
              textColor: "white",
            };
          } else {
            marked[dateString] = {
              color: colours.primaryLight,
              textColor: colours.primary,
            };
          }
        }
      }
    }

    return marked;
  };

  const formatDateRange = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) {
      return "Add dates";
    }

    const start = new Date(searchParams.checkIn);
    const end = new Date(searchParams.checkOut);

    return `${start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })} - ${end.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;
  };

  const formatPriceRange = () => {
    const { minPrice, maxPrice } = searchParams;
    if (!minPrice && !maxPrice) return "Any price";
    if (minPrice && maxPrice) return `£${minPrice} - £${maxPrice}`;
    if (minPrice) return `From £${minPrice}`;
    return `Up to £${maxPrice}`;
  };

  const savePrices = () => {
    updateSearchParams({
      minPrice: tempMinPrice ? Number(tempMinPrice) : undefined,
      maxPrice: tempMaxPrice ? Number(tempMaxPrice) : undefined,
    });
    setShowPricePicker(false);
  };

  const saveRentalType = () => {
    updateSearchParams({
      rentalType: tempRentalType === "Any" ? undefined : tempRentalType,
    });
    setShowTypePicker(false);
  };

  const saveDates = () => {
    if (tempDates.checkIn && tempDates.checkOut) {
      updateSearchParams({
        checkIn: tempDates.checkIn,
        checkOut: tempDates.checkOut,
      });
    }
    setShowDatePicker(false);
  };

  const saveGuests = () => {
    updateSearchParams({ guests: tempGuests });
    setShowGuestPicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchCard}>
        {/* Location Input with Autocomplete */}
        <LocationAutocomplete
          initialValue={searchParams.location}
          onChangeText={(text) =>
            updateSearchParams({ location: text, lat: null, lng: null })
          }
          onSelect={(description, lat, lng) => {
            updateSearchParams({
              location: description,
              lat,
              lng,
            });
            // Optional: Automatically trigger search or move focus
          }}
        />

        <View style={styles.divider} />

        {/* Radius Selector */}
        <TouchableOpacity
          style={styles.searchRow}
          onPress={() => setShowRadiusPicker(true)}
        >
          <MaterialIcons name="radar" size={22} color={colours.darkSlateBlue} />
          <View style={styles.searchContent}>
            <Text style={styles.searchLabel}>Radius</Text>
            <Text style={styles.searchValue}>{searchParams.radiusKm} km</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Date Selector */}
        <TouchableOpacity
          style={styles.searchRow}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons
            name="calendar-today"
            size={22}
            color={colours.darkSlateBlue}
          />
          <View style={styles.searchContent}>
            <Text style={styles.searchLabel}>When</Text>
            <Text
              style={[
                styles.searchValue,
                !searchParams.checkIn && styles.searchPlaceholder,
              ]}
            >
              {formatDateRange()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Guest Selector */}
        <TouchableOpacity
          style={styles.searchRow}
          onPress={() => setShowGuestPicker(true)}
        >
          <MaterialIcons
            name="person"
            size={24}
            color={colours.darkSlateBlue}
          />
          <View style={styles.searchContent}>
            <Text style={styles.searchLabel}>Who</Text>
            <Text style={styles.searchValue}>
              {searchParams.guests}{" "}
              {searchParams.guests === 1 ? "guest" : "guests"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Price Range Selector */}
        <TouchableOpacity
          style={styles.searchRow}
          onPress={() => setShowPricePicker(true)}
        >
          <MaterialIcons
            name="currency-pound"
            size={24}
            color={colours.darkSlateBlue}
          />
          <View style={styles.searchContent}>
            <Text style={styles.searchLabel}>Price</Text>
            <Text
              style={[
                styles.searchValue,
                !searchParams.minPrice &&
                  !searchParams.maxPrice &&
                  styles.searchPlaceholder,
              ]}
            >
              {formatPriceRange()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Rental Type Selector */}
        <TouchableOpacity
          style={styles.searchRow}
          onPress={() => setShowTypePicker(true)}
        >
          <MaterialIcons name="home" size={24} color={colours.darkSlateBlue} />
          <View style={styles.searchContent}>
            <Text style={styles.searchLabel}>Type</Text>
            <Text
              style={[
                styles.searchValue,
                !searchParams.rentalType && styles.searchPlaceholder,
              ]}
            >
              {RentalType.get(searchParams.rentalType ?? "any")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Button */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          (!searchParams.location || !searchParams.checkIn) &&
            styles.searchButtonDisabled,
        ]}
        onPress={handleSearch}
        disabled={
          !searchParams.location ||
          !searchParams.checkIn ||
          !searchParams.checkOut
        }
      >
        <MaterialIcons name="search" size={24} color="white" />
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {/* Radius Picker Modal */}
      <Modal
        visible={showRadiusPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRadiusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.radiusModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Radius</Text>
              <TouchableOpacity onPress={() => setShowRadiusPicker(false)}>
                <MaterialIcons name="close" size={24} color={colours.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              How far from the location should we search?
            </Text>

            <View style={styles.radiusOptions}>
              {RADIUS_OPTIONS.map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.radiusChip,
                    searchParams.radiusKm === km && styles.radiusChipSelected,
                  ]}
                  onPress={() => {
                    updateSearchParams({ radiusKm: km });
                    setShowRadiusPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      searchParams.radiusKm === km &&
                        styles.radiusChipTextSelected,
                    ]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dates</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons name="close" size={24} color={colours.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              {!tempDates.checkIn
                ? "Select check-in date"
                : !tempDates.checkOut
                  ? "Select check-out date"
                  : `${Math.ceil(
                      (new Date(tempDates.checkOut).getTime() -
                        new Date(tempDates.checkIn).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )} nights selected`}
            </Text>

            <Calendar
              markedDates={getMarkedDates()}
              onDayPress={handleDatePress}
              markingType="period"
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                selectedDayBackgroundColor: colours.primary,
                todayTextColor: colours.primary,
                arrowColor: colours.primary,
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setTempDates({ checkIn: null, checkOut: null });
                }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!tempDates.checkIn || !tempDates.checkOut) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={saveDates}
                disabled={!tempDates.checkIn || !tempDates.checkOut}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guest Picker Modal */}
      <Modal
        visible={showGuestPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGuestPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.guestModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Number of Guests</Text>
              <TouchableOpacity onPress={() => setShowGuestPicker(false)}>
                <MaterialIcons name="close" size={24} color={colours.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.guestSelector}>
              <TouchableOpacity
                style={[
                  styles.guestButton,
                  tempGuests <= 1 && styles.guestButtonDisabled,
                ]}
                onPress={() => setTempGuests(Math.max(1, tempGuests - 1))}
                disabled={tempGuests <= 1}
              >
                <MaterialIcons
                  name="remove"
                  size={24}
                  color={tempGuests <= 1 ? colours.muted : colours.primary}
                />
              </TouchableOpacity>

              <Text style={styles.guestCount}>{tempGuests}</Text>

              <TouchableOpacity
                style={[
                  styles.guestButton,
                  tempGuests >= 10 && styles.guestButtonDisabled,
                ]}
                onPress={() => setTempGuests(Math.min(10, tempGuests + 1))}
                disabled={tempGuests >= 10}
              >
                <MaterialIcons
                  name="add"
                  size={24}
                  color={tempGuests >= 10 ? colours.muted : colours.primary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveGuests}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Range Modal */}
      <Modal
        visible={showPricePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPricePicker(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.priceModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Price Range</Text>
                <TouchableOpacity onPress={() => setShowPricePicker(false)}>
                  <MaterialIcons name="close" size={24} color={colours.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Min price (£)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor={colours.textSecondary}
                    keyboardType="numeric"
                    value={tempMinPrice}
                    onChangeText={setTempMinPrice}
                  />
                </View>
                <Text style={styles.priceSeparator}>–</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Max price (£)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Any"
                    placeholderTextColor={colours.textSecondary}
                    keyboardType="numeric"
                    value={tempMaxPrice}
                    onChangeText={setTempMaxPrice}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setTempMinPrice("");
                    setTempMaxPrice("");
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={savePrices}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rental Type Modal */}
      <Modal
        visible={showTypePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.typeModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Property Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <MaterialIcons name="close" size={24} color={colours.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {RENTAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    tempRentalType === type && styles.typeOptionSelected,
                  ]}
                  onPress={() => setTempRentalType(type as string)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      tempRentalType === type && styles.typeOptionTextSelected,
                    ]}
                  >
                    {RentalType.get(type)}
                  </Text>
                  {tempRentalType === type && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={colours.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 16 }]}
              onPress={saveRentalType}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  searchCard: {
    backgroundColor: colours.surface,
    borderRadius: 16,
    padding: 8,
    elevation: 4,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colours.border,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: colours.text,
  },
  searchContent: {
    flex: 1,
  },
  searchLabel: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 2,
  },
  searchValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colours.text,
  },
  searchPlaceholder: {
    color: colours.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginHorizontal: 12,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: colours.muted,
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colours.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  guestModalContent: {
    maxHeight: 280,
  },
  priceModalContent: {
    maxHeight: 320,
  },
  typeModalContent: {
    maxHeight: 400,
  },
  radiusModalContent: {
    maxHeight: 280,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colours.text,
  },
  modalHint: {
    fontSize: 14,
    color: colours.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colours.primary,
  },
  saveButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colours.primary,
    alignItems: "center",
    marginBottom: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colours.muted,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  guestSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 24,
  },
  guestButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonDisabled: {
    backgroundColor: colours.surface,
  },
  guestCount: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.text,
    minWidth: 40,
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 6,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colours.text,
    backgroundColor: colours.surface,
  },
  priceSeparator: {
    fontSize: 20,
    color: colours.textSecondary,
    marginTop: 20,
  },
  typeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  typeOptionSelected: {
    backgroundColor: colours.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  typeOptionText: {
    fontSize: 15,
    color: colours.text,
  },
  typeOptionTextSelected: {
    fontWeight: "700",
    color: colours.primary,
  },
  radiusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 8,
  },
  radiusChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  radiusChipSelected: {
    borderColor: colours.primary,
    backgroundColor: colours.primaryLight,
  },
  radiusChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: colours.textSecondary,
  },
  radiusChipTextSelected: {
    color: colours.primary,
  },
});

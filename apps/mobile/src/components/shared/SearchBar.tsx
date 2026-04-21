import { useSearch } from "@/context/SearchContext";
import LocationAutocomplete from "@/components/search/LocationAutocomplete";
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

const RADIUS_OPTIONS = [5, 15, 30, 50, 100] as const;

export default function SearchBar() {
  const { searchParams, updateSearchParams } = useSearch();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
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
  const months = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    return d.toISOString().split("T")[0];
  });

  const handleSearch = (event: any) => {
    event.preventDefault();
    router.push("/properties/search");
  };

  const handleModeChange = (mode: string) => {
    updateSearchParams({
      rentalType: mode,
      checkIn: null,
      checkOut: null,
    });
    setTempDates({ checkIn: null, checkOut: null });
  };

  const handleDatePress = (day: any) => {
    const dateString = day.dateString;
    const isShortTerm = searchParams.rentalType === "short_term";

    if (isShortTerm) {
      if (!tempDates.checkIn || tempDates.checkOut) {
        // No check-in yet, or starting a fresh selection
        setTempDates({ checkIn: dateString, checkOut: null });
      } else {
        if (dateString <= tempDates.checkIn) {
          // Tapped on or before check-in — reset
          setTempDates({ checkIn: dateString, checkOut: null });
        } else {
          // Snap to the nearest whole week (ceiling) from check-in
          const checkInDate = new Date(tempDates.checkIn);
          const tappedDate = new Date(dateString);
          const diffDays = Math.ceil(
            (tappedDate.getTime() - checkInDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const weeks = Math.max(1, Math.ceil(diffDays / 7));
          const checkOut = new Date(tempDates.checkIn);
          checkOut.setDate(checkOut.getDate() + weeks * 7);
          setTempDates({
            checkIn: tempDates.checkIn,
            checkOut: checkOut.toISOString().split("T")[0],
          });
        }
      }
    } else {
      // Holiday: free range selection
      if (!tempDates.checkIn || (tempDates.checkIn && tempDates.checkOut)) {
        setTempDates({ checkIn: dateString, checkOut: null });
      } else {
        if (dateString <= tempDates.checkIn) {
          setTempDates({ checkIn: dateString, checkOut: null });
        } else {
          setTempDates({ ...tempDates, checkOut: dateString });
        }
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
        {/* Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchParams.rentalType !== "short_term" &&
                styles.modeButtonActive,
            ]}
            onPress={() => handleModeChange("holiday")}
          >
            <MaterialIcons
              name="beach-access"
              size={18}
              color={
                searchParams.rentalType !== "short_term"
                  ? "white"
                  : colours.textSecondary
              }
            />
            <View>
              <Text
                style={[
                  styles.modeButtonText,
                  searchParams.rentalType !== "short_term" &&
                    styles.modeButtonTextActive,
                ]}
              >
                Holiday
              </Text>
              <Text
                style={[
                  styles.modeButtonSubText,
                  searchParams.rentalType !== "short_term" &&
                    styles.modeButtonSubTextActive,
                ]}
              >
                per night
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              searchParams.rentalType === "short_term" &&
                styles.modeButtonActive,
            ]}
            onPress={() => handleModeChange("short_term")}
          >
            <MaterialIcons
              name="calendar-today"
              size={18}
              color={
                searchParams.rentalType === "short_term"
                  ? "white"
                  : colours.textSecondary
              }
            />
            <View>
              <Text
                style={[
                  styles.modeButtonText,
                  searchParams.rentalType === "short_term" &&
                    styles.modeButtonTextActive,
                ]}
              >
                Short-Term
              </Text>
              <Text
                style={[
                  styles.modeButtonSubText,
                  searchParams.rentalType === "short_term" &&
                    styles.modeButtonSubTextActive,
                ]}
              >
                per week
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

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
              {(() => {
                const isShortTerm = searchParams.rentalType === "short_term";
                if (!tempDates.checkIn) {
                  return isShortTerm
                    ? "Tap your arrival date"
                    : "Select check-in date";
                }
                if (!tempDates.checkOut) {
                  return isShortTerm
                    ? "Now tap your departure date"
                    : "Select check-out date";
                }
                if (isShortTerm) {
                  const nights = Math.ceil(
                    (new Date(tempDates.checkOut).getTime() -
                      new Date(tempDates.checkIn).getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  const weeks = nights / 7;
                  return `${weeks} week${weeks !== 1 ? "s" : ""} selected`;
                }
                return `${Math.ceil(
                  (new Date(tempDates.checkOut).getTime() -
                    new Date(tempDates.checkIn).getTime()) /
                    (1000 * 60 * 60 * 24),
                )} nights selected`;
              })()}
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
          <View style={styles.datePickerContent}>
            {/* ── PINNED TOP ── title + hint + date chips */}
            <View style={styles.datePickerPinnedTop}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Dates</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <MaterialIcons name="close" size={24} color={colours.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalHint}>
                {(() => {
                  const isShortTerm = searchParams.rentalType === "short_term";
                  if (!tempDates.checkIn) {
                    return isShortTerm
                      ? "Select week start date"
                      : "Select check-in date";
                  }
                  if (!tempDates.checkOut) {
                    return "Select check-out date";
                  }
                  if (isShortTerm) {
                    return `Week of ${new Date(tempDates.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
                  }
                  return `${Math.ceil(
                    (new Date(tempDates.checkOut).getTime() -
                      new Date(tempDates.checkIn).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )} nights selected`;
                })()}
              </Text>

              <View style={styles.selectedDatesRow}>
                <View style={styles.dateChip}>
                  <Text style={styles.dateChipLabel}>
                    {searchParams.rentalType === "short_term"
                      ? "Week start"
                      : "Check-in"}
                  </Text>
                  <Text style={styles.dateChipValue}>
                    {tempDates.checkIn
                      ? new Date(tempDates.checkIn).toLocaleDateString()
                      : "Select date"}
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-forward"
                  size={16}
                  color={colours.textSecondary}
                />
                <View style={styles.dateChip}>
                  <Text style={styles.dateChipLabel}>
                    {searchParams.rentalType === "short_term"
                      ? "Week end"
                      : "Check-out"}
                  </Text>
                  <Text style={styles.dateChipValue}>
                    {tempDates.checkOut
                      ? new Date(tempDates.checkOut).toLocaleDateString()
                      : "Select date"}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── SCROLLABLE MONTHS ── only this section scrolls */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.calendarScrollContent}
            >
              {months.map((monthStart) => (
                <Calendar
                  key={monthStart}
                  current={monthStart}
                  hideArrows
                  disableMonthChange
                  hideExtraDays
                  markingType="period"
                  markedDates={getMarkedDates()}
                  onDayPress={handleDatePress}
                  minDate={new Date().toISOString().split("T")[0]}
                  style={styles.monthCalendar}
                  theme={{
                    backgroundColor: colours.cardBackground,
                    calendarBackground: colours.cardBackground,
                    textSectionTitleColor: colours.text,
                    selectedDayBackgroundColor: colours.primary,
                    selectedDayTextColor: "white",
                    todayTextColor: colours.primary,
                    dayTextColor: colours.text,
                    textDisabledColor: colours.textSecondary,
                    monthTextColor: colours.text,
                    arrowColor: colours.primary,
                  }}
                />
              ))}
            </ScrollView>

            {/* ── PINNED BOTTOM ── always visible */}
            <View style={styles.datePickerPinnedBottom}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setTempDates({ checkIn: null, checkOut: null })}
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
  modeToggleContainer: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  modeButtonActive: {
    borderColor: colours.primary,
    backgroundColor: colours.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.textSecondary,
  },
  modeButtonTextActive: {
    color: "white",
  },
  modeButtonSubText: {
    fontSize: 11,
    color: colours.muted,
  },
  modeButtonSubTextActive: {
    color: "rgba(255,255,255,0.75)",
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
  datePickerContent: {
    backgroundColor: colours.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  datePickerPinnedTop: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  calendarScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  monthCalendar: {
    marginBottom: 8,
  },
  datePickerPinnedBottom: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    backgroundColor: colours.cardBackground,
  },
  selectedDatesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colours.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
  },
  dateChip: {
    flex: 1,
  },
  dateChipLabel: {
    fontSize: 11,
    color: colours.textSecondary,
    marginBottom: 2,
  },
  dateChipValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
  },
});

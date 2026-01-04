import { colours } from "@/styles/colours";
import { useSearch } from "@/context/SearchContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function SearchBar() {
  const { searchParams, updateSearchParams } = useSearch();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [tempDates, setTempDates] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
  });
  const [tempGuests, setTempGuests] = useState(searchParams.guests);

  const handleSearch = () => {
    // Navigate to search results
    router.push("/properties/search");
  };

  const handleDatePress = (day: any) => {
    const dateString = day.dateString;

    if (!tempDates.checkIn || (tempDates.checkIn && tempDates.checkOut)) {
      // Start new selection
      setTempDates({ checkIn: dateString, checkOut: null });
    } else {
      // Complete selection
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
        {/* Location Input */}
        <TouchableOpacity style={styles.searchRow} onPress={handleSearch}>
          <MaterialIcons
            name="search"
            size={24}
            color={colours.textSecondary}
          />
          <TextInput
            style={styles.locationInput}
            placeholder="Where are you going?"
            placeholderTextColor={colours.textSecondary}
            value={searchParams.location}
            onChangeText={(text) => updateSearchParams({ location: text })}
          />
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
            color={colours.textSecondary}
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
          <MaterialIcons name="person" size={24} color={colours.textSecondary} />
          <View style={styles.searchContent}>
            <Text style={styles.searchLabel}>Who</Text>
            <Text style={styles.searchValue}>
              {searchParams.guests} {searchParams.guests === 1 ? "guest" : "guests"}
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
        disabled={!searchParams.location || !searchParams.checkIn}
      >
        <MaterialIcons name="search" size={24} color="white" />
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

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
                      (1000 * 60 * 60 * 24)
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  searchCard: {
    backgroundColor: colours.surface,
    borderRadius: 16,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
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
    fontSize: 14,
    fontWeight: "500",
    color: colours.text,
  },
  searchPlaceholder: {
    color: colours.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginHorizontal: 16,
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
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colours.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  guestModalContent: {
    maxHeight: "40%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
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
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colours.primary,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: colours.muted,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  guestSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 32,
  },
  guestButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonDisabled: {
    backgroundColor: colours.border,
  },
  guestCount: {
    fontSize: 32,
    fontWeight: "700",
    color: colours.text,
    minWidth: 60,
    textAlign: "center",
  },
});
import Button from "@/components/shared/Button";
import { colours } from "@/styles/colours";
import { PropertyUnavailableDate } from "@/types/property";
import {
    addUnavailableDates,
    fetchUnavailableDateRanges,
    removeUnavailableDates,
} from "@/utils/booking-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

interface UnavailableDatesManagerProps {
  propertyId: string;
}

export default function UnavailableDatesManager({
  propertyId,
}: UnavailableDatesManagerProps) {
  const router = useRouter();
  const [ranges, setRanges] = useState<PropertyUnavailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  useEffect(() => {
    loadRanges();
  }, [propertyId]);

  const loadRanges = async () => {
    try {
      setLoading(true);
      const data = await fetchUnavailableDateRanges(propertyId);
      setRanges(data);
    } catch (error) {
      console.error("Error loading unavailable dates:", error);
      Alert.alert("Error", "Failed to load unavailable dates");
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;

    if (!selectedDates.start || selectedDates.end) {
      // Start new selection
      setSelectedDates({ start: dateString, end: null });
    } else if (selectedDates.start) {
      // Complete selection
      if (new Date(dateString) < new Date(selectedDates.start)) {
        // If selected date is before start, swap them
        setSelectedDates({
          start: dateString,
          end: selectedDates.start,
        });
      } else {
        setSelectedDates({
          ...selectedDates,
          end: dateString,
        });
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // Mark existing unavailable ranges
    ranges.forEach((range) => {
      const start = new Date(range.start_date);
      const end = new Date(range.end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (dateStr === range.start_date) {
          marked[dateStr] = {
            startingDay: true,
            color: colours.danger,
            textColor: "white",
          };
        } else if (dateStr === range.end_date) {
          marked[dateStr] = {
            endingDay: true,
            color: colours.danger,
            textColor: "white",
          };
        } else {
          marked[dateStr] = {
            color: colours.danger,
            textColor: "white",
          };
        }
      }
    });

    // Mark currently selected range
    if (selectedDates.start) {
      marked[selectedDates.start] = {
        startingDay: true,
        color: colours.primary,
        textColor: "white",
      };

      if (selectedDates.end) {
        const start = new Date(selectedDates.start);
        const end = new Date(selectedDates.end);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          if (dateStr === selectedDates.start) continue;
          if (dateStr === selectedDates.end) {
            marked[dateStr] = {
              endingDay: true,
              color: colours.primary,
              textColor: "white",
            };
          } else {
            marked[dateStr] = {
              color: colours.primaryLight,
              textColor: colours.primary,
            };
          }
        }
      }
    }

    return marked;
  };

  const handleAddRange = async () => {
    if (!selectedDates.start || !selectedDates.end) {
      Alert.alert("Error", "Please select both start and end dates");
      return;
    }

    try {
      const success = await addUnavailableDates(
        propertyId,
        selectedDates.start,
        selectedDates.end
      );

      if (success) {
        Alert.alert("Success", "Unavailable dates added");
        setSelectedDates({ start: null, end: null });
        loadRanges();
      } else {
        Alert.alert("Error", "Failed to add unavailable dates");
      }
    } catch (error) {
      console.error("Error adding unavailable dates:", error);
      Alert.alert("Error", "Failed to add unavailable dates");
    }
  };

  const handleRemoveRange = async (rangeId: string) => {
    Alert.alert(
      "Remove Unavailable Dates",
      "Are you sure you want to remove this unavailable date range?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await removeUnavailableDates(rangeId);
              if (success) {
                Alert.alert("Success", "Unavailable dates removed");
                loadRanges();
              } else {
                Alert.alert("Error", "Failed to remove unavailable dates");
              }
            } catch (error) {
              console.error("Error removing unavailable dates:", error);
              Alert.alert("Error", "Failed to remove unavailable dates");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Manage Unavailable Dates</Text>
          <Text style={styles.subtitle}>
            Select dates when your property will not be available for booking
          </Text>

          <Calendar
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            markingType="period"
            minDate={new Date().toISOString().split("T")[0]}
            theme={{
              selectedDayBackgroundColor: colours.primary,
              todayTextColor: colours.primary,
              arrowColor: colours.primary,
            }}
          />

          {selectedDates.start && selectedDates.end && (
            <View style={styles.selectedRange}>
              <Text style={styles.selectedRangeLabel}>Selected Range:</Text>
              <Text style={styles.selectedRangeText}>
                {new Date(selectedDates.start).toLocaleDateString()} -{" "}
                {new Date(selectedDates.end).toLocaleDateString()}
              </Text>
              <Button
                title="Add Unavailable Dates"
                onPress={handleAddRange}
                buttonStyle={styles.addButton}
              />
            </View>
          )}

          {ranges.length > 0 && (
            <View style={styles.rangesSection}>
              <Text style={styles.sectionTitle}>Unavailable Date Ranges</Text>
              {ranges.map((range) => (
                <View key={range.id} style={styles.rangeCard}>
                  <View style={styles.rangeInfo}>
                    <Text style={styles.rangeDates}>
                      {new Date(range.start_date).toLocaleDateString()} -{" "}
                      {new Date(range.end_date).toLocaleDateString()}
                    </Text>
                    {range.reason && (
                      <Text style={styles.rangeReason}>{range.reason}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveRange(range.id)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons
                      name="delete"
                      size={20}
                      color={colours.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colours.textSecondary,
    marginBottom: 24,
  },
  selectedRange: {
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  selectedRangeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 4,
  },
  selectedRangeText: {
    fontSize: 16,
    color: colours.textSecondary,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colours.primary,
  },
  rangesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 16,
  },
  rangeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rangeInfo: {
    flex: 1,
  },
  rangeDates: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 4,
  },
  rangeReason: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  removeButton: {
    padding: 8,
  },
});
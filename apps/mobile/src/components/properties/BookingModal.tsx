import Button from "@/components/shared/Button";
import { colours } from "@kiado/shared";
import { Property } from "@kiado/shared/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Calendar, DateData } from "react-native-calendars";
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSearch } from "@/context/SearchContext";

interface BookingModalProps {
  visible: boolean;
  property: Property;
  blockedDates?: string[];
  onClose: () => void;
  onConfirm: (checkIn: Date, checkOut: Date, totalPrice: number) => void;
}

export default function BookingModal({
  visible,
  property,
  blockedDates = [],
  onClose,
  onConfirm,
}: BookingModalProps) {
  const { searchParams } = useSearch();
  const isShortTerm = property.rental_type === "short_term";

  const [checkIn, setCheckIn] = useState<string | null>(
    searchParams.checkIn ?? null,
  );
  const [checkOut, setCheckOut] = useState<string | null>(
    searchParams.checkOut ?? null,
  );
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setCheckIn(searchParams.checkIn ?? null);
      setCheckOut(searchParams.checkOut ?? null);
      if (searchParams.checkIn && searchParams.checkOut) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 400);
      }
    }
  }, [visible]);

  useEffect(() => {
    if (checkIn && checkOut) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [checkIn, checkOut]);

  const markedDates = useMemo(() => {
    const marked: any = {};

    blockedDates.forEach((date) => {
      marked[date] = {
        disabled: true,
        disableTouchEvent: true,
        textColor: colours.textSecondary,
        customContainerStyle: {
          backgroundColor: colours.border,
        },
      };
    });

    if (checkIn) {
      marked[checkIn] = {
        ...marked[checkIn],
        startingDay: true,
        color: colours.primary,
        textColor: "white",
        disabled: false,
        disableTouchEvent: false,
      };
    }
    if (checkOut) {
      marked[checkOut] = {
        ...marked[checkOut],
        endingDay: true,
        color: colours.primary,
        textColor: "white",
        disabled: false,
        disableTouchEvent: false,
      };
    }
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (dateStr !== checkIn && dateStr !== checkOut) {
          marked[dateStr] = {
            ...marked[dateStr],
            color: colours.primary + "40",
            textColor: colours.text,
            disabled: blockedDates.includes(dateStr),
            disableTouchEvent: blockedDates.includes(dateStr),
          };
        }
      }
    }

    return marked;
  }, [checkIn, checkOut, blockedDates]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateWeeks = () => Math.round(calculateNights() / 7);

  const calculateTotalPrice = () => {
    if (isShortTerm) {
      return (property.price || 0) * calculateWeeks();
    }
    return (property.price || 0) * calculateNights();
  };

  const handleDayPress = (day: DateData) => {
    const selectedDate = day.dateString;

    if (blockedDates.includes(selectedDate)) {
      Alert.alert("Unavailable", "This date is not available for booking.");
      return;
    }

    if (isShortTerm) {
      // Auto-snap: check-out is always exactly 7 days after check-in
      const checkOutDate = new Date(selectedDate);
      checkOutDate.setDate(checkOutDate.getDate() + 7);
      const checkOutStr = checkOutDate.toISOString().split("T")[0];

      // Validate no blocked dates fall within the 7-day range
      const start = new Date(selectedDate);
      const end = new Date(checkOutStr);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (blockedDates.includes(dateStr)) {
          Alert.alert(
            "Unavailable",
            "This week contains unavailable dates. Please choose a different week.",
          );
          return;
        }
      }

      setCheckIn(selectedDate);
      setCheckOut(checkOutStr);
    } else {
      // Holiday: free range selection
      if (!checkIn || (checkIn && checkOut)) {
        setCheckIn(selectedDate);
        setCheckOut(null);
      } else {
        if (selectedDate <= checkIn) {
          setCheckIn(selectedDate);
          setCheckOut(null);
          return;
        }

        const start = new Date(checkIn);
        const end = new Date(selectedDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          if (blockedDates.includes(dateStr)) {
            Alert.alert(
              "Unavailable",
              "Selected range includes unavailable dates. Please choose different dates.",
            );
            setCheckIn(null);
            setCheckOut(null);
            return;
          }
        }

        setCheckOut(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    if (!checkIn || !checkOut) {
      Alert.alert("Error", "Please select check-in and check-out dates");
      return;
    }

    const totalPrice = calculateTotalPrice();
    onConfirm(new Date(checkIn), new Date(checkOut), totalPrice);
  };

  const weeks = calculateWeeks();
  const nights = calculateNights();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Your Stay</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colours.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyLocation}>
              {property.city || property.address}
            </Text>

            {/* Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.label}>
                {isShortTerm ? "Select Your Week" : "Select Your Dates"}
              </Text>
              {isShortTerm && (
                <Text style={styles.weekHint}>
                  Tap any date to book that full week (7 nights)
                </Text>
              )}
              <View style={styles.selectedDatesInfo}>
                <View style={styles.dateInfo}>
                  <Text style={styles.dateInfoLabel}>
                    {isShortTerm ? "Week start" : "Check-in"}
                  </Text>
                  <Text style={styles.dateInfoValue}>
                    {checkIn
                      ? new Date(checkIn).toLocaleDateString()
                      : "Select date"}
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color={colours.textSecondary}
                />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateInfoLabel}>
                    {isShortTerm ? "Week end" : "Check-out"}
                  </Text>
                  <Text style={styles.dateInfoValue}>
                    {checkOut
                      ? new Date(checkOut).toLocaleDateString()
                      : "Select date"}
                  </Text>
                </View>
              </View>

              <Calendar
                markingType="period"
                markedDates={markedDates}
                onDayPress={handleDayPress}
                minDate={new Date().toISOString().split("T")[0]}
                theme={{
                  backgroundColor: colours.surface,
                  calendarBackground: colours.surface,
                  textSectionTitleColor: colours.text,
                  selectedDayBackgroundColor: colours.primary,
                  selectedDayTextColor: "white",
                  todayTextColor: colours.primary,
                  dayTextColor: colours.text,
                  textDisabledColor: colours.textSecondary,
                  dotColor: colours.primary,
                  selectedDotColor: "white",
                  arrowColor: colours.primary,
                  monthTextColor: colours.text,
                  indicatorColor: colours.primary,
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                }}
              />
            </View>

            {/* Price Summary */}
            {checkIn && checkOut && (
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {isShortTerm
                      ? `£${property.price}/week × ${weeks} week${weeks !== 1 ? "s" : ""}`
                      : `£${property.price} × ${nights} night${nights !== 1 ? "s" : ""}`}
                  </Text>
                  <Text style={styles.summaryValue}>
                    £{calculateTotalPrice().toLocaleString()}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    £{calculateTotalPrice().toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title="Continue to Payment"
              onPress={handleConfirm}
              buttonStyle={styles.confirmButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colours.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colours.text,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: colours.textSecondary,
    marginBottom: 24,
  },
  dateSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 8,
  },
  weekHint: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 12,
    fontStyle: "italic",
  },
  selectedDatesInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colours.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colours.border,
  },
  dateInfo: {
    flex: 1,
  },
  dateInfoLabel: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 4,
  },
  dateInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
  },
  summarySection: {
    backgroundColor: colours.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colours.primary,
  },
  confirmButton: {
    backgroundColor: colours.primary,
  },
});

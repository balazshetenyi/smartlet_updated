import Button from "@/components/shared/Button";
import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Calendar, DateData } from "react-native-calendars";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);

  const markedDates = useMemo(() => {
    const marked: any = {};

    // Mark blocked dates
    blockedDates.forEach(date => {
      marked[date] = {
        disabled: true,
        disableTouchEvent: true,
        textColor: colours.textSecondary,
        customContainerStyle: {
          backgroundColor: colours.border,
        }
      };
    });

    // Mark selected range
    if (checkIn) {
      marked[checkIn] = {
        ...marked[checkIn],
        startingDay: true,
        color: colours.primary,
        textColor: 'white',
        disabled: false,
        disableTouchEvent: false,
      };
    }
    if (checkOut) {
      marked[checkOut] = {
        ...marked[checkOut],
        endingDay: true,
        color: colours.primary,
        textColor: 'white',
        disabled: false,
        disableTouchEvent: false,
      };
    }
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (dateStr !== checkIn && dateStr !== checkOut) {
          marked[dateStr] = {
            ...marked[dateStr],
            color: colours.primary + '40',
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
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalPrice = () => {
    const nights = calculateNights();
    return (property.price || 0) * nights;
  };

  const handleDayPress = (day: DateData) => {
    const selectedDate = day.dateString;

    // Don't allow selection of blocked dates
    if (blockedDates.includes(selectedDate)) {
      Alert.alert("Unavailable", "This date is not available for booking.");
      return;
    }

    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection
      setCheckIn(selectedDate);
      setCheckOut(null);
    } else {
      // Complete the range
      if (selectedDate <= checkIn) {
        Alert.alert("Error", "Check-out date must be after check-in date");
        return;
      }

      // Check if any dates in range are blocked
      const start = new Date(checkIn);
      const end = new Date(selectedDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (blockedDates.includes(dateStr)) {
          Alert.alert(
            "Unavailable",
            "Selected range includes unavailable dates. Please choose different dates."
          );
          setCheckIn(null);
          setCheckOut(null);
          return;
        }
      }

      setCheckOut(selectedDate);
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyLocation}>
              {property.city || property.address}
            </Text>

            {/* Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.label}>Select Your Dates</Text>
              <View style={styles.selectedDatesInfo}>
                <View style={styles.dateInfo}>
                  <Text style={styles.dateInfoLabel}>Check-in</Text>
                  <Text style={styles.dateInfoValue}>
                    {checkIn ? new Date(checkIn).toLocaleDateString() : 'Select date'}
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={colours.textSecondary} />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateInfoLabel}>Check-out</Text>
                  <Text style={styles.dateInfoValue}>
                    {checkOut ? new Date(checkOut).toLocaleDateString() : 'Select date'}
                  </Text>
                </View>
              </View>

              <Calendar
                markingType="period"
                markedDates={markedDates}
                onDayPress={handleDayPress}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  backgroundColor: colours.surface,
                  calendarBackground: colours.surface,
                  textSectionTitleColor: colours.text,
                  selectedDayBackgroundColor: colours.primary,
                  selectedDayTextColor: 'white',
                  todayTextColor: colours.primary,
                  dayTextColor: colours.text,
                  textDisabledColor: colours.textSecondary,
                  dotColor: colours.primary,
                  selectedDotColor: 'white',
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
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  £{property.price} x {calculateNights()} nights
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
    paddingBottom: 20,
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
    marginBottom: 12,
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
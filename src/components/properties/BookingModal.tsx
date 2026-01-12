import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Button from "@/components/shared/Button";

interface BookingModalProps {
  visible: boolean;
  property: Property;
  onClose: () => void;
  onConfirm: (checkIn: Date, checkOut: Date, totalPrice: number) => void;
}

export default function BookingModal({
  visible,
  property,
  onClose,
  onConfirm,
}: BookingModalProps) {
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const calculateNights = () => {
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalPrice = () => {
    const nights = calculateNights();
    return (property.price || 0) * nights;
  };

  const handleConfirm = () => {
    if (checkOut <= checkIn) {
      Alert.alert("Error", "Check-out date must be after check-in date");
      return;
    }

    const totalPrice = calculateTotalPrice();
    onConfirm(checkIn, checkOut, totalPrice);
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

          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.propertyLocation}>
            {property.city || property.address}
          </Text>

          {/* Date Selection */}
          <View style={styles.dateSection}>
            <Text style={styles.label}>Check-in Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCheckInPicker(true)}
            >
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={colours.primary}
              />
              <Text style={styles.dateText}>
                {checkIn.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showCheckInPicker && (
              <DateTimePicker
                value={checkIn}
                mode="date"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowCheckInPicker(Platform.OS === "ios");
                  if (date) setCheckIn(date);
                }}
              />
            )}

            <Text style={styles.label}>Check-out Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={colours.primary}
              />
              <Text style={styles.dateText}>
                {checkOut.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showCheckOutPicker && (
              <DateTimePicker
                value={checkOut}
                mode="date"
                minimumDate={checkIn}
                onChange={(event, date) => {
                  setShowCheckOutPicker(Platform.OS === "ios");
                  if (date) setCheckOut(date);
                }}
              />
            )}
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
    marginTop: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colours.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
  },
  dateText: {
    fontSize: 16,
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
import { colours } from "@/styles/colours";
import { RentalType } from "@/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalTypeSelectorProps {
  value: RentalType;
  onChange: (value: RentalType) => void;
  error?: string;
}

const RentalTypeSelector = ({
  value,
  onChange,
  error,
}: RentalTypeSelectorProps) => {
  const options: Array<{
    value: RentalType;
    label: string;
    icon: string;
    description: string;
  }> = [
    {
      value: "long_term",
      label: "Long Term",
      icon: "home",
      description: "Monthly rental",
    },
    {
      value: "short_term",
      label: "Short Term",
      icon: "calendar-today",
      description: "Weekly rental",
    },
    {
      value: "holiday",
      label: "Holiday",
      icon: "beach-access",
      description: "Nightly rental",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rental Type</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              value === option.value && styles.selectedOption,
            ]}
            onPress={() => onChange(option.value)}
            testID={`rental-type-${option.value}`}
          >
            <MaterialIcons
              name={option.icon as any}
              size={24}
              color={
                value === option.value ? colours.primary : colours.textSecondary
              }
            />
            <Text
              style={[
                styles.optionLabel,
                value === option.value && styles.selectedOptionLabel,
              ]}
            >
              {option.label}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                value === option.value && styles.selectedOptionDescription,
              ]}
            >
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: colours.text,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: colours.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colours.border,
  },
  selectedOption: {
    borderColor: colours.primary,
    backgroundColor: colours.primaryLight,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
    marginTop: 8,
  },
  selectedOptionLabel: {
    color: colours.primary,
  },
  optionDescription: {
    fontSize: 11,
    color: colours.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  selectedOptionDescription: {
    color: colours.primary,
  },
  errorText: {
    color: colours.danger,
    fontSize: 12,
    marginTop: 8,
  },
});

export default RentalTypeSelector;

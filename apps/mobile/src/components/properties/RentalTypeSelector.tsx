import { RentalType } from "@kiado/shared/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const options: Array<{
    value: RentalType;
    label: string;
    icon: string;
    description: string;
  }> = [
    // {
    //   value: "long_term",
    //   label: "Long Term",
    //   icon: "home",
    //   description: "Monthly rental",
    // },
    {
      value: "holiday",
      label: "Holiday",
      icon: "beach-access",
      description: "Nightly rental",
    },
    {
      value: "short_term",
      label: "Short Term",
      icon: "calendar-today",
      description: "Weekly rental",
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
                value === option.value ? theme.primary : theme.textSecondary
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

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: t.text,
    },
    optionsContainer: {
      flexDirection: "row",
      gap: 12,
    },
    option: {
      flex: 1,
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 2,
      borderColor: t.border,
    },
    selectedOption: {
      borderColor: t.primary,
      backgroundColor: t.primaryLight,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
      marginTop: 8,
    },
    selectedOptionLabel: {
      color: t.primary,
    },
    optionDescription: {
      fontSize: 11,
      color: t.textSecondary,
      marginTop: 4,
      textAlign: "center",
    },
    selectedOptionDescription: {
      color: t.primary,
    },
    errorText: {
      color: t.danger,
      fontSize: 12,
      marginTop: 8,
    },
  });
}

export default RentalTypeSelector;

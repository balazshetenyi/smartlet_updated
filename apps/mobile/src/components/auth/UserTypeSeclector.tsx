import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

interface UserTypeSelectorProps {
  value: "tenant" | "landlord" | "service_operator" | "";
  onChange: (value: "tenant" | "landlord") => void;
  error?: string;
}

export const UserTypeSelector = ({
  value,
  onChange,
  error,
}: UserTypeSelectorProps) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>I am a</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.leftButton,
            value === "tenant" && styles.selectedButton,
          ]}
          onPress={() => onChange("tenant")}
          testID="tenant-button"
        >
          <Text
            style={[
              styles.buttonText,
              value === "tenant" && styles.selectedButtonText,
            ]}
          >
            🏠 Tenant
          </Text>
          <Text
            style={[
              styles.buttonSubtext,
              value === "tenant" && styles.selectedButtonSubtext,
            ]}
          >
            Looking for properties
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.rightButton,
            value === "landlord" && styles.selectedButton,
          ]}
          onPress={() => onChange("landlord")}
          testID="landlord-button"
        >
          <Text
            style={[
              styles.buttonText,
              value === "landlord" && styles.selectedButtonText,
            ]}
          >
            🏢 Landlord
          </Text>
          <Text
            style={[
              styles.buttonSubtext,
              value === "landlord" && styles.selectedButtonSubtext,
            ]}
          >
            Managing properties
          </Text>
        </TouchableOpacity>
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
      fontWeight: "bold",
      marginBottom: 10,
      color: t.text,
    },
    buttonContainer: {
      flexDirection: "row",
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: t.muted,
    },
    button: {
      flex: 1,
      padding: 16,
      backgroundColor: t.surface,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 80,
    },
    leftButton: {
      borderRightWidth: 0.5,
      borderRightColor: t.muted,
    },
    rightButton: {
      borderLeftWidth: 0.5,
      borderLeftColor: t.muted,
    },
    selectedButton: {
      backgroundColor: t.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
      marginBottom: 4,
    },
    selectedButtonText: {
      color: "white",
    },
    buttonSubtext: {
      fontSize: 12,
      color: t.muted,
      textAlign: "center",
    },
    selectedButtonSubtext: {
      color: "white",
      opacity: 0.9,
    },
    errorText: {
      color: "red",
      fontSize: 12,
      marginTop: 8,
      paddingHorizontal: 4,
    },
  });
}

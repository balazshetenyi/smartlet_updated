import { colours } from "@/styles/colours";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserTypeSelectorProps {
  value: "tenant" | "landlord" | "";
  onChange: (value: "tenant" | "landlord") => void;
  error?: string;
}

export const UserTypeSelector = ({
  value,
  onChange,
  error,
}: UserTypeSelectorProps) => {
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: colours.text,
  },
  buttonContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colours.muted,
  },
  button: {
    flex: 1,
    padding: 16,
    backgroundColor: colours.surface,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  leftButton: {
    borderRightWidth: 0.5,
    borderRightColor: colours.muted,
  },
  rightButton: {
    borderLeftWidth: 0.5,
    borderLeftColor: colours.muted,
  },
  selectedButton: {
    backgroundColor: colours.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 4,
  },
  selectedButtonText: {
    color: "white",
  },
  buttonSubtext: {
    fontSize: 12,
    color: colours.muted,
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

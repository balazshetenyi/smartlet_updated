import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours } from "@kiado/shared";
import { SurveillanceDeclarationType } from "@kiado/shared/types/property";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  declarationType: SurveillanceDeclarationType | null;
  onDeclarationTypeChange: (type: SurveillanceDeclarationType) => void;
  externalDevicesDescription: string;
  onExternalDevicesDescriptionChange: (text: string) => void;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
}

export default function SurveillanceDeclarationSection({
  declarationType,
  onDeclarationTypeChange,
  externalDevicesDescription,
  onExternalDevicesDescriptionChange,
  confirmed,
  onConfirmedChange,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="security" size={20} color={colours.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Surveillance Declaration</Text>
          <Text style={styles.subtitle}>
            Required by law before your property can be listed
          </Text>
        </View>
      </View>

      <Text style={styles.body}>
        Under UK law, covert surveillance of tenants is a criminal offence. You
        must declare the surveillance status of this property honestly and keep
        it up to date.
      </Text>

      {/* Option: No devices */}
      <TouchableOpacity
        style={[
          styles.option,
          declarationType === "none" && styles.optionSelected,
        ]}
        onPress={() => onDeclarationTypeChange("none")}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={
            declarationType === "none"
              ? "radio-button-checked"
              : "radio-button-unchecked"
          }
          size={22}
          color={declarationType === "none" ? colours.primary : colours.muted}
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>No surveillance devices</Text>
          <Text style={styles.optionDescription}>
            There are no cameras, microphones, or any other surveillance devices
            inside this property.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Option: External only */}
      <TouchableOpacity
        style={[
          styles.option,
          declarationType === "external_only" && styles.optionSelected,
        ]}
        onPress={() => onDeclarationTypeChange("external_only")}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={
            declarationType === "external_only"
              ? "radio-button-checked"
              : "radio-button-unchecked"
          }
          size={22}
          color={
            declarationType === "external_only"
              ? colours.primary
              : colours.muted
          }
        />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>External surveillance only</Text>
          <Text style={styles.optionDescription}>
            There are external devices only (e.g. doorbell camera, exterior
            CCTV). No devices inside the property.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Description field — only shown for external_only */}
      {declarationType === "external_only" && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>
            Describe the external devices and their locations *
          </Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="e.g. Video doorbell at front entrance, CCTV camera above garage door facing the driveway"
            placeholderTextColor={colours.textSecondary}
            value={externalDevicesDescription}
            onChangeText={onExternalDevicesDescriptionChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Confirmation checkbox */}
      <TouchableOpacity
        style={styles.confirmation}
        onPress={() => onConfirmedChange(!confirmed)}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={confirmed ? "check-box" : "check-box-outline-blank"}
          size={22}
          color={confirmed ? colours.primary : colours.muted}
        />
        <Text style={styles.confirmationText}>
          I confirm this declaration is accurate and complete. I understand that
          providing false information is a violation of Kiado's Terms of Service
          and may constitute a criminal offence under UK law.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colours.primary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    backgroundColor: colours.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colours.text,
  },
  subtitle: {
    fontSize: 12,
    color: colours.textSecondary,
    marginTop: 1,
  },
  body: {
    fontSize: 13,
    color: colours.textSecondary,
    lineHeight: 19,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.background,
  },
  optionSelected: {
    borderColor: colours.primary,
    backgroundColor: colours.primaryLight,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
  },
  optionDescription: {
    fontSize: 12,
    color: colours.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  descriptionContainer: {
    gap: 6,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colours.text,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: colours.text,
    backgroundColor: colours.background,
    minHeight: 80,
  },
  confirmation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 4,
  },
  confirmationText: {
    flex: 1,
    fontSize: 12,
    color: colours.textSecondary,
    lineHeight: 18,
  },
});

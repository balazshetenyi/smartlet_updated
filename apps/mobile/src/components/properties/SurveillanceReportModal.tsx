import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours, supabase } from "@kiado/shared";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/shared/Button";
import { showToastMessage } from "@/components/shared/ToastMessage";
import { ImageSourceType } from "@/enums/image-source-type";
import { pickImage } from "@/utils/image-picker-utils";
import {
  submitSurveillanceReport,
  uploadReportPhotos,
} from "@/utils/surveillance-utils";

const MAX_PHOTOS = 3;

type Phase = "form" | "success";

interface SurveillanceReportModalProps {
  visible: boolean;
  propertyId: string;
  propertyTitle: string;
  reporterId: string;
  alreadyReported: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function SurveillanceReportModal({
  visible,
  propertyId,
  propertyTitle,
  reporterId,
  alreadyReported,
  onClose,
  onSubmitSuccess,
}: SurveillanceReportModalProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [description, setDescription] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    if (!visible) {
      setPhase("form");
      setDescription("");
      setConfirmed(false);
      setSubmitting(false);
      setPhotos([]);
    }
  }, [visible]);

  const canSubmit = description.trim().length > 10 && confirmed;

  const handleAddPhoto = () => {
    Alert.alert("Add Evidence Photo", "Choose a source", [
      {
        text: "Take Photo",
        onPress: async () => {
          const asset = await pickImage(ImageSourceType.Camera);
          if (asset) setPhotos((prev) => [...prev, asset]);
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const asset = await pickImage(ImageSourceType.Library);
          if (asset) setPhotos((prev) => [...prev, asset]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const report = await submitSurveillanceReport(
        propertyId,
        reporterId,
        description.trim(),
      );

      if (photos.length > 0) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await uploadReportPhotos(report.id, photos, session);
        }
      }

      setPhase("success");
      onSubmitSuccess();
    } catch {
      showToastMessage({
        message: "Failed to submit report. Please try again.",
        type: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MaterialIcons name="report-problem" size={22} color={colours.danger} />
        <Text style={styles.headerTitle}>Report Suspected Surveillance</Text>
      </View>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="close" size={24} color={colours.text} />
      </TouchableOpacity>
    </View>
  );

  const renderAlreadyReported = () => (
    <View style={styles.centeredState}>
      <View style={styles.stateIconWrapper}>
        <MaterialIcons name="shield" size={56} color={colours.success} />
      </View>
      <Text style={styles.stateTitle}>Report Already Filed</Text>
      <Text style={styles.stateBody}>
        You have already submitted a report for this property. Our team is
        reviewing it. You can track your reports in{" "}
        <Text style={styles.emphasis}>My Reports</Text> under your account.
      </Text>
      <Button
        title="Close"
        onPress={onClose}
        buttonStyle={styles.fullWidthButton}
      />
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.centeredState}>
      <View style={styles.stateIconWrapper}>
        <MaterialIcons name="check-circle" size={64} color={colours.success} />
      </View>
      <Text style={styles.stateTitle}>Report Submitted</Text>
      <Text style={styles.stateBody}>
        Thank you. Your report has been received. We will review it
        confidentially and take appropriate action, which may include:
        {"\n\n"}
        {"• Temporarily suspending the listing\n"}
        {"• Contacting the landlord\n"}
        {"• Reporting to authorities if a criminal offence is confirmed\n\n"}
        You can track this report in{" "}
        <Text style={styles.emphasis}>My Reports</Text> under your account.
      </Text>
      <Button
        title="Close"
        onPress={onClose}
        buttonStyle={styles.fullWidthButton}
      />
    </View>
  );

  const renderForm = () => (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.introText}>
          If you have found or suspect an undisclosed surveillance device in
          this property, please file a report. We investigate all reports
          seriously and in confidence.
        </Text>

        <View style={styles.propertyChip}>
          <Text style={styles.propertyChipText}>🏠 {propertyTitle}</Text>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Describe what you found or suspect{" "}
            <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. A small camera-like device in the smoke detector above the bed, an unexplained blinking LED behind the TV…"
            placeholderTextColor={colours.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Evidence photos */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Evidence photos{" "}
            <Text style={styles.optionalLabel}>
              (optional · max {MAX_PHOTOS})
            </Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoThumbWrapper}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => removePhoto(index)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <MaterialIcons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.photoAddBtn}
                onPress={handleAddPhoto}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="add-a-photo"
                  size={22}
                  color={colours.textSecondary}
                />
                <Text style={styles.photoAddText}>Add photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <MaterialIcons name="warning" size={18} color={colours.warning} />
          <Text style={styles.warningText}>
            Filing a false report is a breach of our Terms of Service and may
            have legal consequences. Only report if you genuinely suspect an
            undisclosed device.
          </Text>
        </View>

        {/* Confirmation checkbox */}
        <TouchableOpacity
          style={styles.confirmRow}
          onPress={() => setConfirmed((v) => !v)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={confirmed ? "check-box" : "check-box-outline-blank"}
            size={22}
            color={confirmed ? colours.primary : colours.muted}
          />
          <Text style={styles.confirmText}>
            I believe this report is accurate and I am not filing it
            maliciously.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={onClose}
          type="outline"
          buttonStyle={styles.actionButton}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const showAlreadyReported = alreadyReported && phase === "form";
  const showSuccess = phase === "success";
  const showForm = !alreadyReported && phase === "form";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.overlay}>
            {renderHeader()}
            <View style={styles.divider} />
            {showAlreadyReported && renderAlreadyReported()}
            {showSuccess && renderSuccess()}
            {showForm && renderForm()}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colours.surface,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colours.text,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  introText: {
    fontSize: 14,
    color: colours.textSecondary,
    lineHeight: 21,
  },
  propertyChip: {
    alignSelf: "flex-start",
    backgroundColor: colours.background,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  propertyChipText: {
    fontSize: 13,
    color: colours.textSecondary,
    fontWeight: "500",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colours.text,
  },
  optionalLabel: {
    fontWeight: "400",
    color: colours.textSecondary,
  },
  required: {
    color: colours.danger,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colours.text,
    backgroundColor: colours.background,
    minHeight: 100,
    lineHeight: 20,
  },
  // Photo picker
  photoRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  photoThumbWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colours.border,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colours.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colours.background,
  },
  photoAddText: {
    fontSize: 11,
    color: colours.textSecondary,
    fontWeight: "500",
  },
  // Warning
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: colours.warning,
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 4,
  },
  confirmText: {
    flex: 1,
    fontSize: 13,
    color: colours.textSecondary,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    backgroundColor: colours.surface,
  },
  actionButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colours.danger,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: colours.muted,
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  stateIconWrapper: {
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
    textAlign: "center",
  },
  stateBody: {
    fontSize: 14,
    color: colours.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  emphasis: {
    fontWeight: "600",
    color: colours.text,
  },
  fullWidthButton: {
    marginTop: 8,
    width: "100%",
  },
});

import Button from "@/components/shared/Button";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { createServiceJob } from "@/utils/service-utils";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_DEFAULT_TITLES } from "@kiado/shared/types/services";
import type { ServiceType } from "@kiado/shared/types/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@kiado/shared";

const SERVICE_TYPES = Object.keys(SERVICE_TYPE_LABELS) as ServiceType[];

type PropertyOption = { id: string; title: string; city?: string };

export default function PostJobScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("cleaning");
  const [title, setTitle] = useState(SERVICE_TYPE_DEFAULT_TITLES["cleaning"]);
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProperties = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("properties")
      .select("id, title, city")
      .eq("landlord_id", profile.id)
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setProperties(list);
    if (list.length > 0) setSelectedProperty(list[0]);
  }, [profile?.id]);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  useEffect(() => {
    const defaultTitles = Object.values(SERVICE_TYPE_DEFAULT_TITLES);
    if (!title || defaultTitles.includes(title)) {
      setTitle(SERVICE_TYPE_DEFAULT_TITLES[serviceType]);
    }
  }, [serviceType]);

  async function handlePost() {
    if (!profile?.id) return;
    if (!selectedProperty) {
      Alert.alert("Property required", "Please select a property for this job.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a job title.");
      return;
    }

    setSubmitting(true);
    const { id: jobId, error } = await createServiceJob({
      landlord_id: profile.id,
      property_id: selectedProperty.id,
      service_type: serviceType,
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_date: scheduledDate.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    if (jobId) {
      const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
      const session = await supabase.auth.getSession();
      fetch(`${functionsUrl}/notify-service-operators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    }

    Alert.alert(
      "Job posted!",
      "Operators in your area have been notified.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Post a Job",
          headerBackTitle: "Back",
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Property selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Property *</Text>
            {properties.length === 0 ? (
              <Text style={styles.noProperties}>
                No properties found. Add a property first.
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.75}
              >
                <MaterialIcons name="home" size={20} color={theme.primary} />
                <View style={styles.selectorText}>
                  <Text style={styles.selectorTitle} numberOfLines={1}>
                    {selectedProperty?.title ?? "Select a property"}
                  </Text>
                  {selectedProperty?.city && (
                    <Text style={styles.selectorSub}>{selectedProperty.city}</Text>
                  )}
                </View>
                <MaterialIcons name="expand-more" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Service type */}
          <View style={styles.section}>
            <Text style={styles.label}>Service type *</Text>
            <View style={styles.chipRow}>
              {SERVICE_TYPES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setServiceType(s)}
                  style={[styles.chip, serviceType === s && styles.chipActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, serviceType === s && styles.chipTextActive]}>
                    {SERVICE_TYPE_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Job title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. End of tenancy clean"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Details about the job, access instructions, what needs doing..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Preferred date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={scheduledDate}
              onChangeText={setScheduledDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>

          <Button
            title="Post Job"
            loading={submitting}
            disabled={submitting || !title.trim() || !selectedProperty}
            onPress={handlePost}
            buttonStyle={styles.postBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Property picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select property</Text>
            <FlatList
              data={properties}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => {
                const active = selectedProperty?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalRow, active && styles.modalRowActive]}
                    onPress={() => {
                      setSelectedProperty(item);
                      setPickerVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.modalRowIcon, active && styles.modalRowIconActive]}>
                      <MaterialIcons
                        name="home"
                        size={20}
                        color={active ? theme.primary : theme.textMuted}
                      />
                    </View>
                    <View style={styles.modalRowText}>
                      <Text style={[styles.modalRowTitle, active && { color: theme.primary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.city && (
                        <Text style={styles.modalRowSub}>{item.city}</Text>
                      )}
                    </View>
                    {active && (
                      <MaterialIcons name="check" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { padding: 16, gap: 20 },
    section: { gap: 10 },
    label: { fontSize: 14, fontWeight: "600", color: t.text },
    noProperties: { fontSize: 14, color: t.textSecondary },
    selectorBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: t.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.primary,
    },
    selectorText: { flex: 1 },
    selectorTitle: { fontSize: 15, fontWeight: "600", color: t.text },
    selectorSub: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: t.border,
      backgroundColor: t.surface,
    },
    chipActive: { borderColor: t.primary, backgroundColor: t.primary + "18" },
    chipText: { fontSize: 13, color: t.textSecondary, fontWeight: "500" },
    chipTextActive: { color: t.primary, fontWeight: "600" },
    input: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 15,
      color: t.text,
    },
    textArea: { height: 110, paddingTop: 12 },
    postBtn: {
      backgroundColor: t.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 4,
    },
    // Modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: t.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 12,
      maxHeight: "70%",
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.border,
      alignSelf: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    modalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    modalRowActive: {
      backgroundColor: t.primary + "0D",
    },
    modalRowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: t.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    modalRowIconActive: {
      backgroundColor: t.primary + "18",
    },
    modalRowText: { flex: 1 },
    modalRowTitle: { fontSize: 15, fontWeight: "500", color: t.text },
    modalRowSub: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
    separator: { height: 1, backgroundColor: t.border, marginHorizontal: 20 },
  });
}

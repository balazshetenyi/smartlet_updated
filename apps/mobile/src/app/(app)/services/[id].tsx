import Button from "@/components/shared/Button";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { fetchPropertyPhotos } from "@/utils/property-utils";
import { applyToServiceJob } from "@/utils/service-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { supabase } from "@kiado/shared";
import type { ServiceType } from "@kiado/shared/types/services";
import { SERVICE_TYPE_LABELS } from "@kiado/shared/types/services";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type JobDetail = {
  id: string;
  title: string;
  service_type: ServiceType;
  description?: string;
  scheduled_date?: string;
  status: string;
  landlord_id: string;
  properties: {
    id: string;
    title: string;
    city?: string;
    address?: string;
    postcode?: string;
    bedrooms?: number;
    bathrooms?: number;
    description?: string;
  };
};

export default function ServiceJobDetailScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { keyboardOffset } = useKeyboardOffset();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [quotePrice, setQuotePrice] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadJob = useCallback(async () => {
    if (!id || !profile?.id) return;
    const { data, error } = await supabase
      .from("service_jobs")
      .select(
        `
        id, title, service_type, description, scheduled_date, status, landlord_id,
        properties!inner (id, title, city, address, postcode, bedrooms, bathrooms, description)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }
    const jobData = data as unknown as JobDetail;
    setJob(jobData);

    const property = Array.isArray(jobData.properties)
      ? jobData.properties[0]
      : jobData.properties;
    if (property?.id) {
      fetchPropertyPhotos(property.id).then(setPhotos);
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from("service_job_applications")
      .select("id")
      .eq("job_id", id)
      .eq("operator_id", profile.id)
      .maybeSingle();

    setHasApplied(!!existing);
    setLoading(false);
  }, [id, profile?.id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  async function handleApply() {
    if (!job || !profile?.id) return;

    const price = parseFloat(quotePrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid quote", "Please enter a valid price.");
      return;
    }

    setSubmitting(true);
    const { error } = await applyToServiceJob({
      job_id: job.id,
      quote_price: price,
      cover_note: coverNote.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      Alert.alert(
        "Application submitted!",
        "The landlord will review your quote and get back to you.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    }
  }

  const property = job
    ? Array.isArray(job.properties)
      ? job.properties[0]
      : job.properties
    : null;

  const isOperator = profile?.user_role === "service_operator";
  const isLandlord = profile?.user_role === "landlord";
  const isOpen = job?.status === "open";

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: job?.title ?? "Job Details",
          headerBackTitle: "Back",
        }}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !job ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Job not found.</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          bottomOffset={keyboardOffset + 20}
        >
          {/* Job info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons
                name="category"
                size={16}
                color={theme.textMuted}
              />
              <Text style={styles.infoText}>
                {SERVICE_TYPE_LABELS[job.service_type]}
              </Text>
            </View>
            {property && (
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="location-on"
                  size={16}
                  color={theme.textMuted}
                />
                <Text style={styles.infoText}>
                  {property.city ?? property.title ?? property.address}
                </Text>
              </View>
            )}
            {job.scheduled_date && (
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="calendar-today"
                  size={16}
                  color={theme.textMuted}
                />
                <Text style={styles.infoText}>
                  {new Date(job.scheduled_date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons
                name="info-outline"
                size={16}
                color={theme.textMuted}
              />
              <Text style={[styles.infoText, { textTransform: "capitalize" }]}>
                {job.status}
              </Text>
            </View>
          </View>

          {job.description && (
            <View style={styles.descCard}>
              <Text style={styles.descLabel}>About this job</Text>
              <Text style={styles.descText}>{job.description}</Text>
            </View>
          )}

          {/* Property details */}
          {property && (
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>Property</Text>

              {photos.length > 0 ? (
                <View style={styles.galleryWrap}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      setActivePhoto(
                        Math.round(
                          e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 64),
                        ),
                      );
                    }}
                  >
                    {photos.map((url, i) => (
                      <Image
                        key={`${url}-${i}`}
                        source={{ uri: url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                  {photos.length > 1 && (
                    <View style={styles.galleryDots}>
                      {photos.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            i === activePhoto && styles.dotActive,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noPhotos}>
                  <MaterialIcons
                    name="home"
                    size={36}
                    color={theme.textMuted}
                  />
                  <Text style={styles.noPhotosText}>No photos uploaded</Text>
                </View>
              )}

              <Text style={styles.propertyName}>{property.title}</Text>

              {(property.address || property.city) && (
                <View style={styles.propertyRow}>
                  <MaterialIcons
                    name="location-on"
                    size={15}
                    color={theme.textMuted}
                  />
                  <Text style={styles.propertyMeta}>
                    {[property.address, property.city, property.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              )}

              {(property.bedrooms != null || property.bathrooms != null) && (
                <View style={styles.chips}>
                  {property.bedrooms != null && (
                    <View style={styles.chip}>
                      <MaterialIcons
                        name="bed"
                        size={15}
                        color={theme.primary}
                      />
                      <Text style={styles.chipText}>
                        {property.bedrooms} bed
                      </Text>
                    </View>
                  )}
                  {property.bathrooms != null && (
                    <View style={styles.chip}>
                      <MaterialIcons
                        name="bathtub"
                        size={15}
                        color={theme.primary}
                      />
                      <Text style={styles.chipText}>
                        {property.bathrooms} bath
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Apply form — service operators only, open jobs */}
          {isOperator && isOpen && !hasApplied && (
            <View style={styles.applyCard}>
              <Text style={styles.applyTitle}>Submit your quote</Text>

              <Text style={styles.fieldLabel}>Your price (£)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={quotePrice}
                onChangeText={setQuotePrice}
                keyboardType="decimal-pad"
              />
              {(() => {
                const price = parseFloat(quotePrice);
                if (!isNaN(price) && price > 0) {
                  const fee = price * 0.06;
                  const net = price - fee;
                  return (
                    <View style={styles.payoutBreakdown}>
                      <View style={styles.payoutRow}>
                        <Text style={styles.payoutLabel}>Platform fee (6%)</Text>
                        <Text style={styles.payoutFee}>−£{fee.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.payoutRow, styles.payoutNetRow]}>
                        <Text style={styles.payoutNetLabel}>You receive</Text>
                        <Text style={styles.payoutNetValue}>£{net.toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                }
                return (
                  <Text style={styles.feeHint}>A 6% platform fee applies to your payout.</Text>
                );
              })()}

              <Text style={styles.fieldLabel}>Cover note (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell the landlord about your experience, availability..."
                placeholderTextColor={theme.textMuted}
                value={coverNote}
                onChangeText={setCoverNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Button
                title="Submit Application"
                loading={submitting}
                disabled={submitting || !quotePrice}
                onPress={handleApply}
                buttonStyle={styles.applyBtn}
              />
            </View>
          )}

          {isOperator && hasApplied && (
            <View style={styles.appliedNote}>
              <MaterialIcons name="check-circle" size={22} color="#22C55E" />
              <Text style={styles.appliedNoteText}>
                You have already applied to this job
              </Text>
            </View>
          )}

          {isLandlord && (
            <Button
              title="Manage Applications"
              onPress={() => router.push(`/services/manage/${job.id}`)}
              buttonStyle={styles.manageBtn}
            />
          )}
        </KeyboardAwareScrollView>
      )}
    </>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: t.bg,
    },
    errorText: { fontSize: 16, color: t.textSecondary },
    container: { flex: 1, backgroundColor: t.bg },
    content: { padding: 16, gap: 16 },
    infoCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 12,
    },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    infoText: { fontSize: 14, color: t.text },
    descCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 8,
    },
    descLabel: { fontSize: 13, fontWeight: "600", color: t.textSecondary },
    descText: { fontSize: 14, color: t.text, lineHeight: 22 },
    applyCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 10,
    },
    applyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
      marginBottom: 4,
    },
    fieldLabel: { fontSize: 13, fontWeight: "600", color: t.textSecondary },
    input: {
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 15,
      color: t.text,
    },
    textArea: { height: 100, paddingTop: 12 },
    applyBtn: {
      backgroundColor: "#F59E0B",
      borderRadius: 12,
      marginTop: 4,
    },
    appliedNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 16,
      backgroundColor: "#22C55E12",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#22C55E30",
    },
    appliedNoteText: { fontSize: 14, color: "#22C55E", fontWeight: "500" },
    manageBtn: {
      backgroundColor: t.primary,
      borderRadius: 12,
    },
    feeHint: {
      fontSize: 12,
      color: t.textMuted,
      fontStyle: "italic",
    },
    payoutBreakdown: {
      backgroundColor: t.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
    },
    payoutRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    payoutNetRow: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 6,
      marginTop: 2,
    },
    payoutLabel: { fontSize: 13, color: t.textSecondary },
    payoutFee: { fontSize: 13, color: t.textSecondary },
    payoutNetLabel: { fontSize: 13, fontWeight: "700", color: t.text },
    payoutNetValue: { fontSize: 15, fontWeight: "700", color: "#22C55E" },
    propertyCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      gap: 0,
    },
    propertyTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: t.textSecondary,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
    },
    galleryWrap: {
      position: "relative",
    },
    galleryImage: {
      width: SCREEN_WIDTH - 64,
      height: 180,
    },
    galleryDots: {
      position: "absolute",
      bottom: 10,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    dotActive: {
      backgroundColor: "#fff",
      width: 20,
    },
    noPhotos: {
      height: 100,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: t.bg,
      marginHorizontal: 16,
      borderRadius: 12,
    },
    noPhotosText: { fontSize: 13, color: t.textMuted },
    propertyName: {
      fontSize: 15,
      fontWeight: "700",
      color: t.text,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    propertyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    propertyMeta: { fontSize: 13, color: t.textSecondary, flex: 1 },
    chips: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: t.primaryLight ?? "#F59E0B18",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    chipText: { fontSize: 13, fontWeight: "600", color: t.primary },
    propertyDesc: {
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
    },
  });
}

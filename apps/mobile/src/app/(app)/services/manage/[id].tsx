import Button from "@/components/shared/Button";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { cancelServiceJob, fetchJobWithApplications } from "@/utils/service-utils";
import { SERVICE_TYPE_LABELS } from "@kiado/shared/types/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ApplicationRow = {
  id: string;
  quote_price: number;
  cover_note?: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    service_operator_profiles: {
      bio?: string;
      services: string[];
      city?: string;
      company_name?: string;
    } | null;
  };
};

type JobRow = {
  id: string;
  title: string;
  service_type: string;
  status: string;
  scheduled_date?: string;
  assigned_operator_id?: string;
  payment_status: string;
  final_price?: number;
  created_at: string;
  properties: { id: string; title: string; address?: string; city?: string; postcode?: string };
};

export default function ManageJobScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();

  const [job, setJob] = useState<JobRow | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationRow | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { job: j, applications: apps } = await fetchJobWithApplications(id);
      setJob(j as unknown as JobRow);
      setApplications(apps as unknown as ApplicationRow[]);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load job.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleApprove(applicationId: string, operatorName: string) {
    Alert.alert(
      "Approve application",
      `Approve ${operatorName}'s application? Payment will be held in escrow until the job is completed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setApproving(applicationId);
            const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
            try {
              const res = await fetch(`${functionsUrl}/approve-service-application`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ applicationId }),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error ?? "Approval failed");
              setSelectedApp(null);
              await loadData();
              Alert.alert("Application approved!", "A message channel has been opened with the operator.");
            } catch (e) {
              Alert.alert("Error", (e as Error).message);
            } finally {
              setApproving(null);
            }
          },
        },
      ],
    );
  }

  async function handleComplete() {
    Alert.alert(
      "Confirm job complete",
      "This will release the held payment to the operator. Only confirm when the job is fully done.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Release Payment",
          onPress: async () => {
            setCompleting(true);
            const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
            try {
              const res = await fetch(`${functionsUrl}/complete-service-job`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ jobId: id }),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error ?? "Failed to complete job");
              await loadData();
              Alert.alert("Done!", "Payment released to the operator.");
            } catch (e) {
              Alert.alert("Error", (e as Error).message);
            } finally {
              setCompleting(false);
            }
          },
        },
      ],
    );
  }

  async function handleCancel() {
    Alert.alert(
      "Cancel job",
      "Cancel this job? This cannot be undone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Job",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            const { error } = await cancelServiceJob(id);
            if (error) {
              Alert.alert("Error", error);
            } else {
              router.back();
            }
          },
        },
      ],
    );
  }

  function operatorDisplay(app: ApplicationRow) {
    const p = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
    const op = p?.service_operator_profiles;
    const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Operator";
    const primary = op?.company_name || fullName;
    const secondary = op?.company_name ? fullName : null;
    return { primary, secondary, city: op?.city };
  }

  const assignedApp = applications.find(
    (a) => a.status === "approved" && job?.assigned_operator_id,
  );

  const postedDate = job?.created_at
    ? new Date(job.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: job?.title ?? "Manage Job",
          headerBackTitle: "Back",
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color={theme.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !job ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Job not found.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* Property card */}
          <View style={styles.propertyCard}>
            <View style={styles.propertyIcon}>
              <MaterialIcons name="home" size={22} color={theme.primary} />
            </View>
            <View style={styles.propertyText}>
              {(() => {
                const prop = Array.isArray(job.properties) ? job.properties[0] : job.properties;
                const addressLine = [prop?.address, prop?.city, prop?.postcode]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <>
                    <Text style={styles.propertyTitle} numberOfLines={1}>{prop?.title}</Text>
                    {addressLine ? (
                      <Text style={styles.propertySub} numberOfLines={2}>{addressLine}</Text>
                    ) : null}
                  </>
                );
              })()}
            </View>
          </View>

          {/* Job meta */}
          <View style={styles.metaRow}>
            <View style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>
                {SERVICE_TYPE_LABELS[job.service_type as keyof typeof SERVICE_TYPE_LABELS] ?? job.service_type}
              </Text>
            </View>
            {job.scheduled_date && (
              <View style={styles.metaItem}>
                <MaterialIcons name="event" size={14} color={theme.textMuted} />
                <Text style={styles.metaText}>{job.scheduled_date}</Text>
              </View>
            )}
            {postedDate && (
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={14} color={theme.textMuted} />
                <Text style={styles.metaText}>Posted {postedDate}</Text>
              </View>
            )}
          </View>

          {/* Status banner */}
          <View style={[styles.statusBanner, getStatusBannerStyle(job.status)]}>
            <Text style={[styles.statusText, getStatusTextStyle(job.status)]}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              {job.status === "assigned" && job.final_price
                ? ` · £${Number(job.final_price).toFixed(2)} held`
                : ""}
            </Text>
          </View>

          {/* Assigned operator highlight */}
          {assignedApp && (
            <TouchableOpacity
              style={styles.assignedCard}
              onPress={() => setSelectedApp(assignedApp)}
              activeOpacity={0.8}
            >
              <View style={styles.assignedIcon}>
                <MaterialIcons name="person" size={20} color="#22C55E" />
              </View>
              <View style={styles.assignedText}>
                <Text style={styles.assignedLabel}>Matched operator</Text>
                <Text style={styles.assignedName}>
                  {operatorDisplay(assignedApp).primary}
                  {" · "}£{Number(assignedApp.quote_price).toFixed(2)}
                </Text>
                {operatorDisplay(assignedApp).secondary && (
                  <Text style={styles.assignedSub}>{operatorDisplay(assignedApp).secondary}</Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          {/* Complete job action */}
          {job.status === "assigned" && job.payment_status === "held" && (
            <Button
              title="Confirm Job Complete & Release Payment"
              loading={completing}
              disabled={completing}
              onPress={handleComplete}
              buttonStyle={styles.completeBtn}
            />
          )}

          {/* Applications */}
          <Text style={styles.sectionTitle}>
            Applications ({applications.length})
          </Text>

          {applications.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="hourglass-empty" size={40} color={theme.textMuted} />
              <Text style={styles.emptyText}>No applications yet</Text>
              <Text style={styles.emptyHint}>Operators in your area will be notified</Text>
            </View>
          ) : (
            applications.map((app) => {
              const { primary, secondary, city } = operatorDisplay(app);

              return (
                <TouchableOpacity
                  key={app.id}
                  style={[
                    styles.appRow,
                    app.status === "approved" && styles.appRowApproved,
                    app.status === "declined" && styles.appRowDeclined,
                  ]}
                  onPress={() => setSelectedApp(app)}
                  activeOpacity={0.75}
                >
                  <View style={styles.appRowAvatar}>
                    <MaterialIcons name="person" size={20} color={theme.textMuted} />
                  </View>
                  <View style={styles.appRowBody}>
                    <Text style={styles.appRowName}>{primary}</Text>
                    {secondary && <Text style={styles.appRowCity}>{secondary}</Text>}
                    {!secondary && city && <Text style={styles.appRowCity}>{city}</Text>}
                  </View>
                  <Text style={styles.appRowQuote}>£{Number(app.quote_price).toFixed(2)}</Text>
                  <View style={[styles.appBadge, getAppBadgeStyle(app.status)]}>
                    <Text style={[styles.appBadgeText, getAppBadgeTextStyle(app.status)]}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {job.status === "open" && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel this job</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Application detail popup */}
      <Modal
        visible={selectedApp !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedApp(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedApp(null)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            {selectedApp && (() => {
              const { primary, secondary, city } = operatorDisplay(selectedApp);
              const op = (Array.isArray(selectedApp.profiles) ? selectedApp.profiles[0] : selectedApp.profiles)?.service_operator_profiles;

              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalAvatar}>
                      <MaterialIcons name="person" size={28} color={theme.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalName}>{primary}</Text>
                      {secondary && <Text style={styles.modalCompany}>{secondary}</Text>}
                      {city && <Text style={styles.modalCity}>{city}</Text>}
                    </View>
                    <View style={[styles.appBadge, getAppBadgeStyle(selectedApp.status)]}>
                      <Text style={[styles.appBadgeText, getAppBadgeTextStyle(selectedApp.status)]}>
                        {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalQuoteRow}>
                    <Text style={styles.modalQuoteLabel}>Quote</Text>
                    <Text style={styles.modalQuoteValue}>£{Number(selectedApp.quote_price).toFixed(2)}</Text>
                  </View>

                  {op?.bio && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionLabel}>About</Text>
                      <Text style={styles.modalSectionText}>{op.bio}</Text>
                    </View>
                  )}

                  {op?.services && op.services.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionLabel}>Services offered</Text>
                      <View style={styles.servicesRow}>
                        {op.services.map((s: string) => (
                          <View key={s} style={styles.serviceTag}>
                            <Text style={styles.serviceTagText}>
                              {SERVICE_TYPE_LABELS[s as keyof typeof SERVICE_TYPE_LABELS] ?? s}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedApp.cover_note && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionLabel}>Cover note</Text>
                      <Text style={styles.modalSectionText}>{selectedApp.cover_note}</Text>
                    </View>
                  )}

                  {job?.status === "open" && selectedApp.status === "pending" && (
                    <Button
                      title={approving === selectedApp.id ? "Approving…" : "Approve this operator"}
                      loading={approving === selectedApp.id}
                      disabled={approving !== null}
                      onPress={() => handleApprove(selectedApp.id, primary)}
                      buttonStyle={styles.approveBtn}
                    />
                  )}
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function getStatusBannerStyle(status: string) {
  const map: Record<string, object> = {
    open: { backgroundColor: "#3B82F618", borderColor: "#3B82F630" },
    assigned: { backgroundColor: "#F59E0B18", borderColor: "#F59E0B30" },
    completed: { backgroundColor: "#22C55E18", borderColor: "#22C55E30" },
    cancelled: { backgroundColor: "#EF444418", borderColor: "#EF444430" },
  };
  return map[status] ?? {};
}

function getStatusTextStyle(status: string) {
  const map: Record<string, object> = {
    open: { color: "#3B82F6" },
    assigned: { color: "#F59E0B" },
    completed: { color: "#22C55E" },
    cancelled: { color: "#EF4444" },
  };
  return map[status] ?? {};
}

function getAppBadgeStyle(status: string) {
  const map: Record<string, object> = {
    pending: { backgroundColor: "#F59E0B22" },
    approved: { backgroundColor: "#22C55E22" },
    declined: { backgroundColor: "#EF444422" },
    withdrawn: { backgroundColor: "#9CA3AF22" },
  };
  return map[status] ?? {};
}

function getAppBadgeTextStyle(status: string) {
  const map: Record<string, object> = {
    pending: { color: "#F59E0B" },
    approved: { color: "#22C55E" },
    declined: { color: "#EF4444" },
    withdrawn: { color: "#9CA3AF" },
  };
  return map[status] ?? {};
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: t.bg, gap: 12 },
    errorText: { fontSize: 15, color: t.textSecondary, textAlign: "center", paddingHorizontal: 32 },
    retryBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
    retryText: { fontSize: 14, color: t.primary, fontWeight: "600" },
    container: { flex: 1, backgroundColor: t.bg },
    content: { padding: 16, gap: 12 },

    // Property card
    propertyCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    propertyIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: t.primary + "18",
      justifyContent: "center",
      alignItems: "center",
    },
    propertyText: { flex: 1 },
    propertyTitle: { fontSize: 15, fontWeight: "600", color: t.text },
    propertySub: { fontSize: 12, color: t.textSecondary, marginTop: 1 },

    // Meta row
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
    serviceChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: t.primary + "18",
    },
    serviceChipText: { fontSize: 12, fontWeight: "600", color: t.primary },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 12, color: t.textMuted },

    // Status
    statusBanner: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
    },
    statusText: { fontSize: 14, fontWeight: "700" },

    // Assigned card
    assignedCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: "#22C55E0D",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#22C55E30",
    },
    assignedIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#22C55E18",
      justifyContent: "center",
      alignItems: "center",
    },
    assignedText: { flex: 1 },
    assignedLabel: { fontSize: 11, color: "#22C55E", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
    assignedName: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 2 },
    assignedSub: { fontSize: 12, color: t.textSecondary, marginTop: 1 },

    completeBtn: { backgroundColor: "#22C55E", borderRadius: 12 },

    // Section
    sectionTitle: { fontSize: 15, fontWeight: "700", color: t.text, marginTop: 4 },

    // Empty state
    empty: { alignItems: "center", paddingVertical: 28, gap: 8 },
    emptyText: { fontSize: 15, color: t.textSecondary },
    emptyHint: { fontSize: 13, color: t.textMuted },

    // Application rows
    appRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    appRowApproved: { borderColor: "#22C55E40", backgroundColor: "#22C55E08" },
    appRowDeclined: { opacity: 0.5 },
    appRowAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
    appRowBody: { flex: 1 },
    appRowName: { fontSize: 14, fontWeight: "600", color: t.text },
    appRowCity: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
    appRowQuote: { fontSize: 15, fontWeight: "700", color: t.text },
    appBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    appBadgeText: { fontSize: 11, fontWeight: "600" },

    cancelBtn: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
    cancelBtnText: { fontSize: 14, color: "#EF4444", fontWeight: "500" },

    // Modal
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: t.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      gap: 16,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.border,
      alignSelf: "center",
      marginBottom: 4,
    },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
    modalAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
    modalName: { fontSize: 17, fontWeight: "700", color: t.text },
    modalCity: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    modalQuoteRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: t.border,
    },
    modalQuoteLabel: { fontSize: 14, color: t.textSecondary },
    modalQuoteValue: { fontSize: 24, fontWeight: "700", color: t.text },
    modalSection: { gap: 6 },
    modalSectionLabel: { fontSize: 12, fontWeight: "600", color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    modalSectionText: { fontSize: 14, color: t.text, lineHeight: 20 },
    servicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    serviceTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: t.primary + "18",
    },
    serviceTagText: { fontSize: 12, color: t.primary, fontWeight: "500" },
    approveBtn: { backgroundColor: t.primary, borderRadius: 12, marginBottom: 4 },
    modalCompany: { fontSize: 13, fontWeight: "600", color: t.primary, marginTop: 1 },
  });
}

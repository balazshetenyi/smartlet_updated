import Button from "@/components/shared/Button";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { upsertServiceOperatorProfile } from "@/utils/service-utils";
import { SERVICE_TYPE_LABELS } from "@kiado/shared/types/services";
import type { ServiceType } from "@kiado/shared/types/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

const SERVICE_TYPES = Object.keys(SERVICE_TYPE_LABELS) as ServiceType[];

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

export default function ServiceOnboardingScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, refreshProfile } = useAuthStore();
  const { keyboardOffset } = useKeyboardOffset();

  const [companyName, setCompanyName] = useState("");
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleService(s: ServiceType) {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function handleSave() {
    if (!profile?.id) return;

    if (selectedServices.length === 0) {
      Alert.alert("Services required", "Please select at least one service you offer.");
      return;
    }

    setLoading(true);
    const { error } = await upsertServiceOperatorProfile(profile.id, {
      company_name: companyName.trim() || undefined,
      services: selectedServices,
      city: city.trim() || undefined,
      postcode: postcode.trim() || undefined,
      area_radius_km: radiusKm,
      bio: bio.trim() || undefined,
      is_available: true,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    await refreshProfile();

    Alert.alert(
      "Profile saved!",
      "Set up your payout account now so you can receive payment when a job is approved.",
      [
        {
          text: "Set up payouts",
          onPress: () => {
            router.replace("/service");
            router.push("/(account)/payout-setup");
          },
        },
        {
          text: "Later",
          style: "cancel",
          onPress: () => router.replace("/service"),
        },
      ],
    );
  }

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={keyboardOffset + 170}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="handyman" size={40} color="#F59E0B" />
        </View>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          Tell landlords what services you offer and where you operate
        </Text>
      </View>

      {/* Company name */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Company / trading name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Smith Cleaning Services"
          placeholderTextColor={theme.textMuted}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Services you offer *</Text>
        <View style={styles.chipRow}>
          {SERVICE_TYPES.map((s) => {
            const active = selectedServices.includes(s);
            return (
              <TouchableOpacity
                key={s}
                onPress={() => toggleService(s)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {SERVICE_TYPE_LABELS[s]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your location</Text>
        <TextInput
          style={styles.input}
          placeholder="City (e.g. London)"
          placeholderTextColor={theme.textMuted}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="Postcode (e.g. SW1A 1AA)"
          placeholderTextColor={theme.textMuted}
          value={postcode}
          onChangeText={setPostcode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {/* Radius */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How far will you travel?</Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRadiusKm(r)}
              style={[styles.radiusBtn, radiusKm === r && styles.radiusBtnActive]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.radiusBtnText,
                  radiusKm === r && styles.radiusBtnTextActive,
                ]}
              >
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About you (optional)</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="A short description of your experience and services..."
          placeholderTextColor={theme.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCorrect={false}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          title="Continue"
          loading={loading}
          disabled={loading || selectedServices.length === 0}
          onPress={handleSave}
          buttonStyle={styles.continueBtn}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    header: {
      alignItems: "center",
      paddingTop: 32,
      paddingBottom: 28,
      gap: 12,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: "#F59E0B18",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: t.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: t.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    section: {
      marginBottom: 28,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
      marginBottom: 12,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: t.border,
      backgroundColor: t.surface,
    },
    chipActive: {
      borderColor: "#F59E0B",
      backgroundColor: "#F59E0B18",
    },
    chipText: {
      fontSize: 14,
      color: t.textSecondary,
      fontWeight: "500",
    },
    chipTextActive: {
      color: "#F59E0B",
      fontWeight: "600",
    },
    input: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: t.text,
    },
    bioInput: {
      height: 100,
      paddingTop: 12,
    },
    radiusRow: {
      flexDirection: "row",
      gap: 10,
    },
    radiusBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.border,
      backgroundColor: t.surface,
      alignItems: "center",
    },
    radiusBtnActive: {
      borderColor: "#F59E0B",
      backgroundColor: "#F59E0B18",
    },
    radiusBtnText: {
      fontSize: 14,
      fontWeight: "500",
      color: t.textSecondary,
    },
    radiusBtnTextActive: {
      color: "#F59E0B",
      fontWeight: "700",
    },
    footer: {
      paddingTop: 8,
    },
    continueBtn: {
      backgroundColor: "#F59E0B",
      borderRadius: 14,
      paddingVertical: 14,
    },
  });
}

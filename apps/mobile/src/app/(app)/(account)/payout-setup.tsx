import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@kiado/shared";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/store/auth-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

export default function PayoutSetupScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [loading, setLoading] = useState(false);
  const [manualAccountId, setManualAccountId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const { profile, refreshProfile } = useAuthStore();

  const handleConnectStripe = async (existingAccountId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-or-connect-stripe-account",
        {
          body: { stripeAccountId: existingAccountId },
        },
      );

      if (error) throw error;

      if (data?.url) {
        // If Stripe returns an onboarding URL (for new or incomplete accounts)
        const result = await WebBrowser.openAuthSessionAsync(data.url);
        if (result.type === "success") {
          await refreshProfile();
        }
      } else if (data?.success) {
        // If the account was connected directly (already exists and valid)
        Alert.alert("Success", "Stripe account connected successfully.");
        await refreshProfile();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to connect Stripe account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="payments" size={64} color={theme.primary} />
        </View>

        <Text style={styles.title}>
          {profile?.stripe_account_id
            ? "Stripe Connected"
            : "Get Paid with Stripe"}
        </Text>

        <Text style={styles.description}>
          {profile?.stripe_account_id
            ? "Your account is connected to Stripe. You can manage your payouts and view your balance below."
            : "To receive payments for your properties, you need to connect a Stripe account."}
        </Text>

        {!profile?.stripe_account_id && (
          <>
            <Button
              title="Connect New Stripe Account"
              onPress={() => handleConnectStripe()}
              loading={loading && !manualAccountId}
              buttonStyle={styles.button}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            {!showManualInput ? (
              <TouchableOpacity onPress={() => setShowManualInput(true)}>
                <Text style={styles.toggleText}>
                  Connect Existing Stripe Account
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.manualContainer}>
                <Input
                  label="Stripe Account ID"
                  placeholder="acct_..."
                  value={manualAccountId}
                  onChangeText={setManualAccountId}
                  autoCapitalize="none"
                />
                <Button
                  title="Save & Connect"
                  onPress={() => handleConnectStripe(manualAccountId)}
                  loading={loading && !!manualAccountId}
                  disabled={!manualAccountId.startsWith("acct_")}
                  buttonStyle={styles.button}
                />
              </View>
            )}
          </>
        )}

        {profile?.stripe_account_id && (
          <View style={styles.connectedInfo}>
            <Text style={styles.footerText}>
              Account ID: {profile.stripe_account_id}
            </Text>
            <Button
              title="Go to Stripe Dashboard"
              onPress={() => handleConnectStripe(profile.stripe_account_id)}
              loading={loading}
              buttonStyle={[styles.button, { marginTop: 16 }]}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
      padding: 24,
      paddingBottom: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: t.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: t.text,
      marginBottom: 16,
      textAlign: "center",
    },
    description: {
      fontSize: 16,
      color: t.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      width: "100%",
      backgroundColor: t.primary,
    },
    footerText: {
      marginTop: 24,
      fontSize: 12,
      color: t.muted,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      width: "100%",
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: t.border,
    },
    dividerText: {
      marginHorizontal: 10,
      color: t.muted,
      fontSize: 12,
    },
    toggleText: {
      color: t.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    manualContainer: {
      width: "100%",
    },
    connectedInfo: {
      width: "100%",
      alignItems: "center",
    },
  });
}

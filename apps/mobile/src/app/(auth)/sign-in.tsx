import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { signInSchema } from "@/config/schemas";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Toast } from "react-native-toast-notifications";

const logoImg = require("@kiado/shared/assets/images/kiado-logo.png");

export default function SignIn() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams();
  const { loading, signIn } = useAuthStore();
  const { keyboardOffset } = useKeyboardOffset();
  const router = useRouter();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (params?.justSignedUp === "true") {
      Toast.show("Please check your email to verify your account.", {
        type: "info",
      });
    }
  }, []);

  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardOffset + 170}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Brand header */}
      <View style={styles.header}>
        <Image
          source={logoImg}
          style={styles.logo}
          contentFit="contain"
          tintColor={theme.text}
        />
        <Text style={styles.headline}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your Kiado account</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <Input
              label="Email"
              onChangeText={onChange}
              value={value}
              placeholder="email@address.com"
              autoCapitalize="none"
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error?.message}
              textContentType="emailAddress"
              keyboardType="email-address"
              autoComplete="email"
              autoCorrect={false}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <Input
              label="Password"
              onChangeText={onChange}
              value={value}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error?.message}
              textContentType="password"
              autoComplete="password"
              autoCorrect={false}
            />
          )}
        />

        <Button
          title="Sign In"
          disabled={formState.isSubmitting}
          loading={loading}
          onPress={handleSubmit(signIn)}
          buttonStyle={styles.primaryBtn}
          testID="sign-in-button"
          accessibilityLabel="Sign In Button"
          accessibilityRole="button"
          accessibilityState={{ disabled: formState.isSubmitting }}
        />

        <TouchableOpacity
          style={styles.forgotWrap}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <Text style={styles.footerLabel}>Don't have an account?</Text>
        <Button
          title="Create an account"
          disabled={formState.isSubmitting}
          onPress={() => router.push("/select-role")}
          type="outline"
          testID="sign-up-button"
          accessibilityLabel="Sign Up Button"
          accessibilityRole="button"
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: t.surface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    header: {
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 36,
    },
    logo: {
      width: 140,
      height: 38,
      marginBottom: 28,
    },
    headline: {
      fontSize: 28,
      fontWeight: "800",
      color: t.text,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 15,
      color: t.textSecondary,
    },
    form: {
      gap: 4,
    },
    primaryBtn: {
      marginTop: 8,
      backgroundColor: t.primary,
    },
    forgotWrap: {
      alignItems: "flex-end",
      paddingVertical: 12,
    },
    forgotText: {
      fontSize: 14,
      color: t.primary,
      fontWeight: "500",
    },
    footer: {
      marginTop: 32,
      gap: 16,
    },
    divider: {
      height: 1,
      backgroundColor: t.border,
    },
    footerLabel: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: "center",
    },
  });
}

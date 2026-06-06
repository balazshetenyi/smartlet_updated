import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { signInSchema } from "@/config/schemas";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { Toast } from "react-native-toast-notifications";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

/**
 * Auth component for user authentication.
 * It allows users to sign in with their email and password.
 * If the user does not have an account, they can navigate to the sign-up page.
 */
export default function SignIn() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams();
  const { loading, signIn } = useAuthStore();
  const { keyboardOffset } = useKeyboardOffset();
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  useEffect(() => {
    if (params?.justSignedUp === "true") {
      // show banner / toast that instructs user to check email
      Toast.show("Please check your email to verify your account.", {
        type: "info",
      });
    }
  }, []);

  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardOffset + 170}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: theme.surface }}
    >
      <View className="p-4">
        <Controller
          control={control}
          name="email"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <Input
              label="Email"
              leftIcon={{
                type: "font-awesome",
                name: "envelope",
                color: theme.muted,
              }}
              onChangeText={onChange}
              value={value}
              placeholder="email@address.com"
              autoCapitalize={"none"}
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error ? error.message : undefined}
              textContentType="emailAddress"
              keyboardType="email-address"
              style={{ color: theme.text }}
              autoComplete="email"
              autoCorrect={false}
            />
          )}
        />
      </View>
      <View className="p-4 pt-0">
        <Controller
          control={control}
          name="password"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <Input
              label="Password"
              leftIcon={{
                type: "font-awesome",
                name: "lock",
                color: theme.muted,
              }}
              onChangeText={onChange}
              value={value}
              placeholder="Password"
              secureTextEntry
              autoCapitalize={"none"}
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error ? error.message : undefined}
              textContentType="password"
              keyboardType="default"
              style={{ color: theme.text }}
              autoComplete="password"
              autoCorrect={false}
            />
          )}
        />
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <View className="p-4 self-stretch">
          <Button
            title="Sign in"
            disabled={formState.isSubmitting}
            // loading={loading}
            onPress={handleSubmit(signIn)}
            buttonStyle={{ backgroundColor: theme.primary }}
            testID="sign-in-button"
            accessibilityLabel="Sign In Button"
            accessibilityHint="Sign in with your email and password"
            accessibilityRole="button"
            accessibilityState={{ disabled: formState.isSubmitting }}
          />
          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={{ marginTop: 20 }}
          >
            <Text
              style={{
                color: theme.primary,
                textAlign: "right",
                fontSize: 14,
              }}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
        <View className="p-4 self-stretch">
          <Text
            style={{
              color: theme.muted,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Don&#39;t have an account yet?
          </Text>
          <Button
            title="Sign up"
            disabled={formState.isSubmitting}
            loading={loading}
            onPress={() => router.push("/sign-up")}
            testID="sign-up-button"
            accessibilityLabel="Sign Up Button"
            accessibilityHint="Navigate to sign up page"
            accessibilityRole="button"
            accessibilityState={{ disabled: formState.isSubmitting }}
            buttonStyle={{
              backgroundColor: theme.surface,
              borderColor: theme.primary,
              borderWidth: 1,
            }}
            titleStyle={{ color: theme.primary }}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({});
}

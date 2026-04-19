import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { colours, supabase } from "@kiado/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import * as zod from "zod";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { showToastMessage } from "@/components/shared/ToastMessage";

const changePasswordSchema = zod
  .object({
    currentPassword: zod
      .string()
      .min(6, { message: "Current password is required" }),
    newPassword: zod
      .string()
      .min(8, { message: "New password must be at least 8 characters" }),
    confirmPassword: zod.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { keyboardOffset } = useKeyboardOffset();

  const { control, handleSubmit, formState, reset } = useForm<
    zod.infer<typeof changePasswordSchema>
  >({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: zod.infer<typeof changePasswordSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        // Supabase returns "same password" errors or auth errors here
        showToastMessage({
          message: error.message,
          type: "danger",
        });
        return;
      }

      showToastMessage({
        message: "Password changed successfully!",
        type: "success",
      });

      reset();
      router.back();
    } catch (err) {
      console.error("[ChangePassword] error.");
      showToastMessage({
        message: "Failed to change password. Please try again.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardOffset + 170}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Enter your current password, then choose a new one.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="currentPassword"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <Input
                label="Current Password"
                leftIcon={{
                  type: "font-awesome",
                  name: "lock",
                  color: colours.muted,
                }}
                onChangeText={onChange}
                value={value}
                placeholder="Enter current password"
                secureTextEntry
                editable={!loading}
                onBlur={onBlur}
                errorMessage={error?.message}
                textContentType="password"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <Input
                label="New Password"
                leftIcon={{
                  type: "font-awesome",
                  name: "lock",
                  color: colours.muted,
                }}
                onChangeText={onChange}
                value={value}
                placeholder="Enter new password"
                secureTextEntry
                editable={!loading}
                onBlur={onBlur}
                errorMessage={error?.message}
                textContentType="newPassword"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <Input
                label="Confirm New Password"
                leftIcon={{
                  type: "font-awesome",
                  name: "lock",
                  color: colours.muted,
                }}
                onChangeText={onChange}
                value={value}
                placeholder="Confirm new password"
                secureTextEntry
                editable={!loading}
                onBlur={onBlur}
                errorMessage={error?.message}
                textContentType="newPassword"
                autoCapitalize="none"
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Update Password"
              onPress={handleSubmit(onSubmit)}
              disabled={!formState.isValid || loading}
              loading={loading}
              buttonStyle={[
                styles.updateButton,
                { backgroundColor: colours.primary },
              ]}
              titleStyle={styles.updateButtonText}
            />
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colours.surface,
    justifyContent: "center",
  },
  header: {
    marginBottom: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: colours.text,
  },
  subtitle: {
    fontSize: 14,
    color: colours.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    width: "100%",
    gap: 10,
  },
  buttonContainer: {
    marginTop: 14,
  },
  updateButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

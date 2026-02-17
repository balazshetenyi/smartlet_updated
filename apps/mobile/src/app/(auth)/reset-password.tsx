import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { supabase } from "@/lib/supabase";
import { colours } from "@/styles/colours";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import * as zod from "zod";

const resetPasswordSchema = zod
  .object({
    password: zod
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: zod.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordScreen() {
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle the deep link parameters
    if (params.access_token && params.refresh_token) {
      // Set the session with the tokens from the email link
      supabase.auth.setSession({
        access_token: params.access_token as string,
        refresh_token: params.refresh_token as string,
      });
    }
  }, [params]);

  const handleUpdatePassword = async (
    data: zod.infer<typeof resetPasswordSchema>
  ) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Toast.show("Password updated successfully!", {
          type: "success",
          placement: "top",
          duration: 3000,
          animationType: "slide-in",
        });

        // Navigate to login or home screen
        router.replace("/");
      }
    } catch (error) {
      console.error("Password update error:", error);
      Alert.alert("Error", "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>Enter your new password below.</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
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
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error ? error.message : undefined}
              textContentType="newPassword"
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
              label="Confirm Password"
              leftIcon={{
                type: "font-awesome",
                name: "lock",
                color: colours.muted,
              }}
              onChangeText={onChange}
              value={value}
              placeholder="Confirm new password"
              secureTextEntry
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error ? error.message : undefined}
              textContentType="newPassword"
            />
          )}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Update Password"
            onPress={handleSubmit(handleUpdatePassword)}
            disabled={formState.isSubmitting}
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
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: colours.text,
  },
  subtitle: {
    fontSize: 16,
    color: colours.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    width: "100%",
  },
  buttonContainer: {
    marginTop: 20,
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

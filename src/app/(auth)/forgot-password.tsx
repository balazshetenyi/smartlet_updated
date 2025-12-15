import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { supabase } from "@/lib/supabase";
import { colours } from "@/styles/colours";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import * as zod from "zod";

const forgotPasswordSchema = zod.object({
  email: zod.string().email({ message: "Invalid email address" }),
});

export default function ForgotPasswordScreen() {
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (
    data: zod.infer<typeof forgotPasswordSchema>
  ) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: "community-noticeboard://reset-password",
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Toast.show("Password reset email sent! Check your inbox.", {
          type: "success",
          placement: "top",
          duration: 3000,
          animationType: "slide-in",
        });

        // Navigate back to login screen after success
        router.back();
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>
      </View>

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
              leftIcon={{
                type: "font-awesome",
                name: "envelope",
                color: colours.muted,
              }}
              onChangeText={onChange}
              value={value}
              placeholder="email@address.com"
              autoCapitalize="none"
              editable={!formState.isSubmitting}
              onBlur={onBlur}
              errorMessage={error ? error.message : undefined}
              textContentType="emailAddress"
              keyboardType="email-address"
            />
          )}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Send Reset Email"
            onPress={handleSubmit(handleResetPassword)}
            disabled={formState.isSubmitting}
            loading={loading}
            buttonStyle={[
              styles.resetButton,
              { backgroundColor: colours.primary },
            ]}
            titleStyle={styles.resetButtonText}
          />
        </View>

        <View style={styles.backButtonContainer}>
          <Button
            title="Back to Sign In"
            onPress={() => router.back()}
            disabled={loading}
            buttonStyle={styles.backButton}
            titleStyle={styles.backButtonText}
            type="outline"
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
  resetButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonContainer: {
    marginTop: 16,
  },
  backButton: {
    borderRadius: 8,
    paddingVertical: 12,
    borderColor: colours.primary,
  },
  backButtonText: {
    fontSize: 16,
    color: colours.primary,
  },
});

import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { signInSchema } from "@/config/schemas";
import { supabase } from "@/lib/supabase";
import { colours } from "@/styles/colours";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import * as zod from "zod";

/**
 * Auth component for user authentication.
 * It allows users to sign in with their email and password.
 * If the user does not have an account, they can navigate to the sign-up page.
 */
export default function SignIn() {
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail(data: zod.infer<typeof signInSchema>) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) Alert.alert(error.message);
    else {
      Toast.show("Signed in successfully", {
        type: "success",
        placement: "top",
        duration: 3000,
      });
    }
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-between bg-white">
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
                color: colours.muted,
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
              style={{ color: colours.text }}
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
                color: colours.muted,
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
              style={{ color: colours.text }}
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
          paddingBottom: 50,
        }}
      >
        <View className="p-4 self-stretch">
          <Button
            title="Sign in"
            disabled={formState.isSubmitting}
            loading={loading}
            onPress={handleSubmit(signInWithEmail)}
            buttonStyle={{ backgroundColor: colours.primary }}
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
                color: colours.primary,
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
              color: colours.muted,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Don't have an account yet?
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
              backgroundColor: colours.surface,
              borderColor: colours.primary,
              borderWidth: 1,
            }}
            titleStyle={{ color: colours.primary }}
          />
        </View>
      </View>
    </View>
  );
}

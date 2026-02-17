import { signUpSchema } from "@/config/schemas";
import { colours } from "@/styles/colours";
import {
  getPasswordStrength,
  getPasswordStrengthText,
} from "@/utils/auth-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Input from "@/components/shared/Input.tsx";
import Button from "@/components/shared/Button.tsx";
import { UserTypeSelector } from "@/components/auth/UserTypeSeclector.tsx";
import { Toast } from "react-native-toast-notifications";
import zod from "zod";
import { useAuthStore } from "@/store/auth-store.ts";

const SignUp = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { signUpWithEmail, loading, session } = useAuthStore();

  const { control, handleSubmit, formState, watch } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      user_type: "tenant" as "tenant" | "landlord",
    },
    mode: "onChange",
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const email = watch("email");
  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const userType = watch("user_type");

  const isFormValid =
    formState.isValid &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "";

  const handleSignUp = async (data: zod.infer<typeof signUpSchema>) => {
    if (!isFormValid) {
      Alert.alert("Invalid Input", "Please fill out all fields correctly.");
      return;
    }

    const result = await signUpWithEmail!({
      ...data,
    });

    if (result.success) {
      if (session) {
        Toast.show("Account created successfully!", {
          type: "success",
          placement: "top",
          duration: 2000,
          animationType: "slide-in",
        });
        router.replace("/");
      } else {
        Toast.show(
          "Account created! Please check your email to verify your account.",
          {
            type: "success",
            placement: "top",
            duration: 3000,
            animationType: "slide-in",
          },
        );
        router.push("/(auth)");
      }
    } else {
      Alert.alert("Sign Up Error", result.error);
    }
  };

  const scrollToInput = (inputRef: any) => {
    if (inputRef && scrollViewRef.current) {
      inputRef.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number,
        ) => {
          scrollViewRef.current?.scrollTo({
            x: 0,
            y: pageY - 200, // Offset to show validation messages
            animated: true,
          });
        },
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.form}>
          <Controller
            control={control}
            name="user_type"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <UserTypeSelector
                value={value}
                onChange={onChange}
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="first_name"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <Input
                label="First Name"
                leftIcon={{
                  type: "font-awesome",
                  name: "user",
                  color: colours.muted,
                }}
                onChangeText={onChange}
                onFocus={(e) => scrollToInput(e.target)}
                onBlur={onBlur}
                value={value}
                placeholder="Your first name"
                autoCapitalize="words"
                autoComplete="name-given"
                autoCorrect={false}
                errorMessage={error?.message}
                style={styles.input}
                testID="first-name-input"
                maxLength={50}
              />
            )}
          />

          <Controller
            control={control}
            name="last_name"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <Input
                label="Last Name"
                leftIcon={{
                  type: "font-awesome",
                  name: "user",
                  color: colours.muted,
                }}
                onChangeText={onChange}
                onFocus={(e) => scrollToInput(e.target)}
                onBlur={onBlur}
                value={value}
                placeholder="Your last name"
                autoCapitalize="words"
                autoComplete="name-family"
                autoCorrect={false}
                errorMessage={error?.message}
                style={styles.input}
                testID="last-name-input"
                maxLength={50}
              />
            )}
          />

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
                onFocus={(e) => scrollToInput(e.target)}
                onBlur={onBlur}
                value={value}
                placeholder="email@address.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoCorrect={false}
                errorMessage={error?.message}
                style={styles.input}
                testID="email-input"
                secureTextEntry={false}
                maxLength={100}
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
              <View>
                <Input
                  label="Password"
                  leftIcon={{
                    type: "font-awesome",
                    name: "lock",
                    color: colours.muted,
                  }}
                  onChangeText={onChange}
                  onFocus={(e) => scrollToInput(e.target)}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry={true}
                  placeholder="Password"
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  errorMessage={error?.message}
                  style={styles.input}
                  testID="password-input"
                  keyboardType="default"
                  maxLength={50}
                />
                {value && (
                  <View style={styles.passwordStrength}>
                    <Text style={styles.strengthLabel}>Password Strength:</Text>
                    <Text
                      style={[
                        styles.strengthText,
                        {
                          color: getPasswordStrengthText(
                            getPasswordStrength(value),
                          ).color,
                        },
                      ]}
                    >
                      {getPasswordStrengthText(getPasswordStrength(value)).text}
                    </Text>
                  </View>
                )}
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>
                    Password must contain:
                  </Text>
                  <Text
                    style={[
                      styles.requirement,
                      password.length >= 8 && styles.requirementMet,
                    ]}
                  >
                    • At least 8 characters
                  </Text>
                  <Text
                    style={[
                      styles.requirement,
                      /[A-Z]/.test(password) && styles.requirementMet,
                    ]}
                  >
                    • One uppercase letter
                  </Text>
                  <Text
                    style={[
                      styles.requirement,
                      /[a-z]/.test(password) && styles.requirementMet,
                    ]}
                  >
                    • One lowercase letter
                  </Text>
                  <Text
                    style={[
                      styles.requirement,
                      /[0-9]/.test(password) && styles.requirementMet,
                    ]}
                  >
                    • One number
                  </Text>
                  <Text
                    style={[
                      styles.requirement,
                      /[^A-Za-z0-9]/.test(password) && styles.requirementMet,
                    ]}
                  >
                    • One special character
                  </Text>
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Input
                  label="Confirm Password"
                  leftIcon={{
                    type: "font-awesome",
                    name: "lock",
                    color: colours.muted,
                  }}
                  onChangeText={onChange}
                  onFocus={(e) => scrollToInput(e.target)}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry={true}
                  placeholder="Confirm your password"
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  errorMessage={error?.message}
                  style={styles.input}
                  testID="confirm-password-input"
                />
                {/* Password match indicator */}
                {confirmPassword && password && (
                  <View style={styles.passwordMatch}>
                    <Text
                      style={[
                        styles.matchText,
                        {
                          color:
                            password === confirmPassword
                              ? "#00aa00"
                              : "#ff4444",
                        },
                      ]}
                    >
                      {password === confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords don't match"}
                    </Text>
                  </View>
                )}
              </View>
            )}
          />
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 10 }}>
        <Button
          title="Create Account"
          disabled={loading}
          loading={loading}
          onPress={handleSubmit(handleSignUp)}
          buttonStyle={[
            styles.signUpButton,
            (!isFormValid || loading) && styles.signUpButtonDisabled,
          ]}
          testID="sign-up-button"
        />

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account?</Text>
          <Button
            title="Sign In"
            type="clear"
            onPress={() => router.push("/(auth)")}
            titleStyle={styles.signInButtonText}
            testID="sign-in-link"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  form: {
    width: "100%",
  },
  input: {
    color: colours.text,
  },
  passwordStrength: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  passwordMatch: {
    marginTop: -10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  strengthLabel: {
    fontSize: 12,
    color: colours.muted,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  passwordRequirements: {
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  requirementsTitle: {
    fontSize: 12,
    color: colours.muted,
    marginBottom: 5,
    fontWeight: "bold",
  },
  requirement: {
    fontSize: 11,
    color: colours.muted,
    marginBottom: 2,
  },
  requirementMet: {
    color: "#00aa00",
  },
  sliderContainer: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: colours.text,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  signUpButton: {
    backgroundColor: colours.primary,
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 12,
  },
  signUpButtonDisabled: {
    backgroundColor: colours.muted,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signInText: {
    color: colours.muted,
    fontSize: 14,
  },
  signInButtonText: {
    color: colours.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
});

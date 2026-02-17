import { colours } from "@/styles/colours";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface InputProps {
  label?: string;
  onChangeText?: (text: string) => void;
  onFocus?: (event: any) => void;
  onBlur?: () => void;
  value?: string;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?:
    | "off"
    | "username"
    | "password"
    | "email"
    | "name"
    | "tel"
    | "street-address"
    | "postal-code"
    | "cc-number"
    | "cc-csc"
    | "cc-exp"
    | "cc-exp-month"
    | "cc-exp-year"
    | "name-family"
    | "name-given"
    | "name-middle"
    | "name-prefix"
    | undefined;
  autoCorrect?: boolean;
  errorMessage?: string;
  style?: any;
  testID?: string;
  secureTextEntry?: boolean;
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad"
    | "url";
  maxLength?: number;
  editable?: boolean;
  textContentType?:
    | "none"
    | "URL"
    | "addressCity"
    | "addressCityAndState"
    | "addressState"
    | "countryName"
    | "creditCardNumber"
    | "emailAddress"
    | "familyName"
    | "fullStreetAddress"
    | "givenName"
    | "jobTitle"
    | "location"
    | "middleName"
    | "name"
    | "namePrefix"
    | "nameSuffix"
    | "nickname"
    | "organizationName"
    | "postalCode"
    | "streetAddressLine1"
    | "streetAddressLine2"
    | "sublocality"
    | "telephoneNumber"
    | "username"
    | "password"
    | "newPassword"
    | "oneTimeCode";
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: any; // Keep for backwards compatibility but don't render
}

const Input = ({
  label,
  onChangeText,
  onFocus,
  onBlur,
  value,
  placeholder,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  errorMessage,
  style,
  testID,
  secureTextEntry,
  keyboardType,
  maxLength,
  editable = true,
  textContentType,
  multiline = false,
  numberOfLines = 1,
  leftIcon, // Accept but ignore for now
}: InputProps) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.inputWrapper}>
      <TextInput
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colours.muted}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
          errorMessage && styles.inputError,
          style,
        ]}
        testID={testID}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
        textContentType={textContentType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
    {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: colours.text,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: colours.background,
    color: colours.textSecondary,
    opacity: 0.7,
  },
  inputError: {
    borderColor: colours.danger,
    borderWidth: 1.5,
  },
  errorText: {
    color: colours.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;

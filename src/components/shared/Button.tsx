import { colours } from "@/styles/colours";
import React from "react";
import {
  AccessibilityState,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  buttonStyle?: any;
  titleStyle?: any;
  testID?: string;
  type?: "outline" | "clear" | "solid";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?:
    | "button"
    | "link"
    | "text"
    | "image"
    | "none"
    | "search"
    | "keyboardkey"
    | "summary"
    | "header"
    | "alert"
    | "checkbox"
    | "combobox"
    | "menu"
    | "menubar"
    | "menuitem"
    | "progressbar"
    | "radio"
    | "radiogroup"
    | "scrollbar"
    | "spinbutton"
    | "switch"
    | "tab"
    | "tablist"
    | "timer"
    | "toolbar";
  accessibilityState?: AccessibilityState;
}

const Button = ({
  title,
  onPress,
  disabled,
  loading,
  buttonStyle,
  titleStyle,
  testID,
  type = "solid",
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
}: ButtonProps) => {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button];

    if (type === "outline") {
      baseStyle.push(styles.outlineButton);
    } else if (type === "clear") {
      baseStyle.push(styles.clearButton);
    }

    if (disabled || loading) {
      if (type === "outline") {
        baseStyle.push(styles.disabledOutlineButton);
      } else {
        baseStyle.push(styles.disabledButton);
      }
    }

    if (Array.isArray(buttonStyle)) {
      baseStyle.push(...buttonStyle);
    } else if (buttonStyle) {
      baseStyle.push(buttonStyle);
    }

    return baseStyle;
  };

  const getTitleStyle = () => {
    const baseStyle: TextStyle[] = [styles.title];

    if (type === "outline") {
      baseStyle.push(styles.outlineTitle);
    } else if (type === "clear") {
      baseStyle.push(styles.clearTitle);
    }

    if (disabled || loading) {
      if (type === "outline" || type === "clear") {
        baseStyle.push(styles.disabledOutlineTitle);
      }
    }

    if (titleStyle) {
      baseStyle.push(titleStyle);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={type === "solid" ? "white" : colours.primary}
        />
      ) : (
        <Text style={getTitleStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colours.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colours.primary,
  },
  clearButton: {
    backgroundColor: "transparent",
  },
  disabledButton: {
    backgroundColor: colours.muted,
    opacity: 0.6,
  },
  disabledOutlineButton: {
    borderColor: colours.muted,
    opacity: 0.6,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineTitle: {
    color: colours.primary,
  },
  clearTitle: {
    color: colours.primary,
  },
  disabledOutlineTitle: {
    color: colours.muted,
  },
});

export default Button;

import { useTheme, type AppTheme } from "@/hooks/useTheme";
import React, { useMemo } from "react";
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const getButtonStyle = () => {
    const base: ViewStyle[] = [styles.button];
    if (type === "outline") base.push(styles.outlineButton);
    else if (type === "clear") base.push(styles.clearButton);
    if (disabled || loading) {
      if (type === "outline") base.push(styles.disabledOutlineButton);
      else base.push(styles.disabledButton);
    }
    if (Array.isArray(buttonStyle)) base.push(...buttonStyle);
    else if (buttonStyle) base.push(buttonStyle);
    return base;
  };

  const getTitleStyle = () => {
    const base: TextStyle[] = [styles.title];
    if (type === "outline") base.push(styles.outlineTitle);
    else if (type === "clear") base.push(styles.clearTitle);
    if ((disabled || loading) && (type === "outline" || type === "clear")) {
      base.push(styles.disabledOutlineTitle);
    }
    if (titleStyle) base.push(titleStyle);
    return base;
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
        <ActivityIndicator color={type === "solid" ? "white" : theme.primary} />
      ) : (
        <Text style={getTitleStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    button: {
      backgroundColor: t.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    outlineButton: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: t.primary,
    },
    clearButton: {
      backgroundColor: "transparent",
    },
    disabledButton: {
      backgroundColor: t.muted,
      opacity: 0.6,
    },
    disabledOutlineButton: {
      borderColor: t.muted,
      opacity: 0.6,
    },
    title: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    outlineTitle: {
      color: t.primary,
    },
    clearTitle: {
      color: t.primary,
    },
    disabledOutlineTitle: {
      color: t.muted,
    },
  });
}

export default Button;

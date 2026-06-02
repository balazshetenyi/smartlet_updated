import { HeaderButton } from "@react-navigation/elements";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";

export const HeaderBackButton = () => {
  const router = useRouter();
  const theme = useTheme();

  if (router.canGoBack() === false) return null;

  return (
    <HeaderButton
      onPress={() => router.back()}
      style={{ padding: 4, marginLeft: 8 }}
      accessibilityLabel="Go back"
    >
      <MaterialIcons name="arrow-back" size={24} color={theme.darkSlateBlue} />
    </HeaderButton>
  );
};

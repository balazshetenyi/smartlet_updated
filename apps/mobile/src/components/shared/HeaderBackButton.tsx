import { HeaderButton } from "@react-navigation/elements";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours } from "@kiado/shared";
import { useRouter } from "expo-router";

export const HeaderBackButton = () => {
  const router = useRouter();
  if (router.canGoBack() === false) return null;

  return (
    <HeaderButton
      onPress={() => router.back()}
      style={{
        padding: 4,
      }}
      accessibilityLabel="Go back"
    >
      <MaterialIcons
        name="arrow-back"
        size={24}
        color={colours.darkSlateBlue}
      />
    </HeaderButton>
  );
};

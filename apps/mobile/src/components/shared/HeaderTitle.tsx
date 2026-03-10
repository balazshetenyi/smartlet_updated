import { colours } from "@kiado/shared";
import { StyleSheet, Text } from "react-native";

type HeaderTitleProps = {
  title: string;
};

export const HeaderTitle = ({ title }: HeaderTitleProps) => (
  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.headerTitle}>
    {title}
  </Text>
);

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colours.text,
    maxWidth: 220,
  },
});

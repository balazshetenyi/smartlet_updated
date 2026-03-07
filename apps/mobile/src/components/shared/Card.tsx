import { colours } from "@kiado/shared";
import { StyleSheet, View } from "react-native";

interface ICard {
  children: React.ReactNode;
}

export const Card = ({ children }: ICard) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colours.overlay,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

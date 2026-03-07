import { colours } from "@kiado/shared";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";

interface IPropertyImage {
  uri: string;
}

export const PropertyImage = ({ uri }: IPropertyImage) => {
  return <Image source={{ uri }} style={styles.propertyImage} />;
};

const styles = StyleSheet.create({
  propertyImage: {
    width: "100%",
    height: 180,
    backgroundColor: colours.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

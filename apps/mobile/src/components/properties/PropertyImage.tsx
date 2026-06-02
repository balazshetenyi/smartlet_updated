import { Image } from "expo-image";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

interface IPropertyImage {
  uri: string;
}

export const PropertyImage = ({ uri }: IPropertyImage) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <Image source={{ uri }} style={styles.propertyImage} />;
};

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    propertyImage: {
      width: "100%",
      height: 180,
      backgroundColor: t.border,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
  });
}

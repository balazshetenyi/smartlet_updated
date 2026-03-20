import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useGooglePlaces, PlacePrediction } from "@/hooks/useGooglePlaces";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours } from "@kiado/shared";

interface Props {
  initialValue: string;
  onSelect: (location: string, lat: number, lng: number) => void;
  onChangeText: (text: string) => void;
}

export default function LocationAutocomplete({
  initialValue,
  onSelect,
  onChangeText,
}: Props) {
  const [input, setInput] = useState(initialValue);
  const {
    predictions,
    fetchPredictions,
    getPlaceDetails,
    setPredictions,
    loading,
  } = useGooglePlaces();

  const handleInput = (text: string) => {
    setInput(text);
    onChangeText(text); // Notify parent (SearchBar) that text changed
    fetchPredictions(text); // Fetch from Google Proxy
  };

  const handleSelect = async (place: PlacePrediction) => {
    setInput(place.description);
    setPredictions([]); // Hide dropdown immediately

    const details = await getPlaceDetails(place.place_id);
    if (details) {
      onSelect(place.description, details.lat, details.lng);
    }
  };

  return (
    <View style={styles.container}>
      {/* Input Field (Matches your existing search row style) */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="search" size={24} color={colours.darkSlateBlue} />
        <TextInput
          style={styles.input}
          placeholder="Where are you going?"
          placeholderTextColor={colours.textSecondary}
          value={input}
          onChangeText={handleInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={colours.primary} />}
      </View>

      {/* Floating Dropdown */}
      {predictions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView>
            {predictions.map((item, index) => (
              <React.Fragment key={item.place_id}>
                <TouchableOpacity
                  style={styles.predictionRow}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.iconCircle}>
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color={colours.darkSlateBlue}
                    />
                  </View>
                  <Text style={styles.predictionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
                {index < predictions.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Relative positioning ensures the absolute dropdown stays anchored to this input
    position: "relative",
    zIndex: 1000, // Highest z-index to float over other fields
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colours.text,
  },
  dropdown: {
    position: "absolute",
    top: "100%", // Start immediately below the input
    left: 0,
    right: 0,
    backgroundColor: colours.surface,
    borderRadius: 12,
    marginTop: 8, // Small gap below input
    maxHeight: 300, // Prevent it from taking over the whole screen

    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    // Android Shadow
    elevation: 8,

    // Border for definition
    borderWidth: 1,
    borderColor: colours.border,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colours.background,
    justifyContent: "center",
    alignItems: "center",
  },
  predictionText: {
    flex: 1,
    fontSize: 15,
    color: colours.text,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: colours.border,
    marginLeft: 64, // Indent line to match text start
  },
});

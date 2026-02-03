import AmenitySelector from "@/components/properties/AmenitySelector";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { supabase } from "@/lib/supabase";
import { AddNewProperty, propertySchema } from "@/schemas/property-schema";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import {
  createProperty,
  setCoverImage,
  uploadPropertyImages,
} from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import RentalTypeSelector from "@/components/properties/RentalTypeSelector.tsx";

export default function CreatePropertyScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(true);
  const [assets, setAssets] = useState<Array<ImagePicker.ImagePickerAsset>>([]);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddNewProperty>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      postcode: "",
      address: "",
      rental_type: "holiday",
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      amenities: [],
    },
  });

  const rentalType = watch("rental_type");

  // Helper to get price label based on rental type
  const getPriceLabel = () => {
    switch (rentalType) {
      case "short_term":
        return "Weekly Rent (£)";
      case "holiday":
        return "Daily Rate (£)";
      default:
        return "Monthly Rent (£)";
    }
  };

  const getPricePlaceholder = () => {
    switch (rentalType) {
      case "short_term":
        return "e.g., 350";
      case "holiday":
        return "e.g., 75";
      default:
        return "e.g., 1200";
    }
  };

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photo library to add property photos.",
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const ok = await requestMediaPermission();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.3, // Match quality from image-picker-utils
      selectionLimit: 10,
      base64: true, // Required for uploadImageToStorage
      exif: false,
    });

    if (!result.canceled) {
      setAssets((prev) => {
        const merged = [...prev, ...result.assets];
        // de-dup by uri
        const seen = new Set<string>();
        return merged.filter((i) =>
          seen.has(i.uri) ? false : (seen.add(i.uri), true),
        );
      });
    }
  };

  const removeAsset = (uri: string) => {
    setAssets((prev) => prev.filter((a) => a.uri !== uri));
  };

  const onSubmit = async (data: AddNewProperty) => {
    try {
      console.log("Property data:", data);
      const created = await createProperty({
        ...data,
        landlord_id: profile?.id,
        is_available: isAvailable,
      });

      if (created?.id && assets.length > 0) {
        await uploadPropertyImages(created.id, assets);

        // Get the first photo and set it as cover
        const { data: photos } = await supabase
          .from("property_photos")
          .select("id")
          .eq("property_id", created.id)
          .order("id", { ascending: true })
          .limit(1);

        if (photos && photos.length > 0) {
          await setCoverImage(created.id, photos[0].id);
        }
      }

      Alert.alert("Success", "Property created successfully!", [
        {
          text: "OK",
          onPress: () => {
            reset();
            setAssets([]);
            router.replace("/");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating property:", error);
      Alert.alert("Error", "Failed to create property.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <MaterialIcons name="add-home" size={32} color={colours.primary} />
        <Text style={styles.subtitle}>
          Fill in the details to list your property
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Property Title"
                placeholder="e.g., Modern 2-bed apartment in City Centre"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                errorMessage={errors.title?.message}
                testID="title-input"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description"
                placeholder="Describe your property..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                errorMessage={errors.description?.message}
                testID="description-input"
                style={styles.input}
                multiline
                numberOfLines={4}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Street Address"
                placeholder="e.g., 123 Main Street"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                errorMessage={errors.address?.message}
                testID="address-input"
                style={styles.input}
              />
            )}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="City"
                    placeholder="e.g., London"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    errorMessage={errors.city?.message}
                    testID="city-input"
                    style={styles.input}
                  />
                )}
              />
            </View>

            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="postcode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Postcode"
                    placeholder="e.g., SW1A 1AA"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    errorMessage={errors.postcode?.message}
                    testID="postcode-input"
                    style={styles.input}
                  />
                )}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <Controller
            control={control}
            name="rental_type"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <RentalTypeSelector
                value={value}
                onChange={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={getPriceLabel()}
                placeholder={getPricePlaceholder()}
                onChangeText={(text) => onChange(text ? Number(text) : 0)}
                onBlur={onBlur}
                value={value ? value.toString() : ""}
                keyboardType="numeric"
                errorMessage={errors.price?.message}
                testID="price-input"
                style={styles.input}
              />
            )}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="bedrooms"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Bedrooms"
                    placeholder="e.g., 2"
                    onChangeText={(text) => onChange(text ? Number(text) : 0)}
                    onBlur={onBlur}
                    value={value ? value.toString() : ""}
                    keyboardType="numeric"
                    errorMessage={errors.bedrooms?.message}
                    testID="bedrooms-input"
                    style={styles.input}
                  />
                )}
              />
            </View>

            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="bathrooms"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Bathrooms"
                    placeholder="e.g., 1"
                    onChangeText={(text) => onChange(text ? Number(text) : 0)}
                    onBlur={onBlur}
                    value={value ? value.toString() : ""}
                    keyboardType="numeric"
                    errorMessage={errors.bathrooms?.message}
                    testID="bathrooms-input"
                    style={styles.input}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.availabilityContainer}>
            <View style={styles.availabilityLabel}>
              <MaterialIcons
                name={isAvailable ? "check-circle" : "cancel"}
                size={20}
                color={isAvailable ? colours.success : colours.muted}
              />
              <Text style={styles.availabilityText}>Available for Rent</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{
                false: colours.border,
                true: colours.primaryLight,
              }}
              thumbColor={isAvailable ? colours.primary : colours.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Controller
            control={control}
            name="amenities"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <AmenitySelector
                selectedAmenities={value || []}
                onChange={onChange}
                error={error?.message}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoGrid}>
            {/* Add tile */}
            <Pressable
              onPress={pickImages}
              style={({ pressed }) => [
                styles.addTile,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityLabel="Add photos"
            >
              <MaterialIcons
                name="add-a-photo"
                size={24}
                color={colours.primary}
              />
              <Text style={styles.addTileText}>Add photos</Text>
            </Pressable>

            {/* Selected thumbnails */}
            {assets.map((a) => (
              <View key={a.uri} style={styles.thumbWrapper}>
                <Image source={{ uri: a.uri }} style={styles.thumb} />
                <Pressable
                  onPress={() => removeAsset(a.uri)}
                  style={({ pressed }) => [
                    styles.removeBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityLabel="Remove photo"
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
          <Text style={styles.photoHint}>
            You can upload up to 10 photos. The first photo may be used as the
            cover.
          </Text>
        </View>

        <Button
          title="Create Property"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          loading={isSubmitting}
          buttonStyle={styles.submitButton}
          testID="create-property-button"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 20,
    color: colours.textSecondary,
    marginTop: 4,
  },
  form: {
    width: "100%",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderRadius: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  availabilityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  availabilityLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: "500",
    color: colours.text,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: colours.primary,
    borderRadius: 12,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  addTile: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colours.primary,
    backgroundColor: colours.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addTileText: {
    marginTop: 6,
    fontSize: 12,
    color: colours.primary,
    fontWeight: "600",
  },
  thumbWrapper: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colours.surface,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoHint: {
    marginTop: 8,
    fontSize: 12,
    color: colours.textSecondary,
  },
});

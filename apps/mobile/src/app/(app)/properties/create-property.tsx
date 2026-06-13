import AmenitySelector from "@/components/properties/AmenitySelector";
import RentalTypeSelector from "@/components/properties/RentalTypeSelector";
import SurveillanceDeclarationSection from "@/components/properties/SurveillanceDeclarationSection";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { AddNewProperty, propertySchema } from "@/schemas/property-schema";
import { useAuthStore } from "@/store/auth-store";
import { reverseGeocode } from "@/utils/geocoding-utils";
import {
  createProperty,
  setCoverImage,
  uploadPropertyImages,
} from "@/utils/property-utils";
import { useActionSheet } from "@expo/react-native-action-sheet";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@kiado/shared";
import { generateListingContent } from "@kiado/shared/services/ai-service";
import { SurveillanceDeclarationType } from "@kiado/shared/types/property";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function CreatePropertyScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile } = useAuthStore();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();
  const [isAvailable, setIsAvailable] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [assets, setAssets] = useState<Array<ImagePicker.ImagePickerAsset>>([]);
  const [declarationType, setDeclarationType] =
    useState<SurveillanceDeclarationType | null>(null);
  const [externalDevicesDescription, setExternalDevicesDescription] =
    useState("");
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const isDeclarationValid =
    declarationType !== null &&
    (declarationType === "none" ||
      (declarationType === "external_only" &&
        externalDevicesDescription.trim().length > 0)) &&
    declarationConfirmed;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
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
      max_guests: 0,
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

  const appendAssets = (newAssets: ImagePicker.ImagePickerAsset[]) => {
    setAssets((prev) => {
      const seen = new Set(prev.map((a) => a.uri));
      return [...prev, ...newAssets.filter((a) => !seen.has(a.uri))];
    });
  };

  const addPhotos = () => {
    showActionSheetWithOptions(
      {
        options: ["Cancel", "Take Photo", "Choose from Library"],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0 || buttonIndex == null) return;

        if (buttonIndex === 1) {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission required",
              "Camera access is needed to take photos.",
            );
            return;
          }

          // Request location permission in parallel — silently skip if denied
          const locationPermission =
            await Location.requestForegroundPermissionsAsync();

          const result = await ImagePicker.launchCameraAsync({
            quality: 0.3,
            base64: true,
            exif: false,
          });

          if (!result.canceled) {
            appendAssets(result.assets);

            // Auto-fill address only if all three fields are currently empty
            const { address, city, postcode } = getValues();
            if (
              !address &&
              !city &&
              !postcode &&
              locationPermission.status === "granted"
            ) {
              try {
                const pos = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                const detected = await reverseGeocode(
                  pos.coords.latitude,
                  pos.coords.longitude,
                );
                if (detected) {
                  if (detected.address)
                    setValue("address", detected.address, {
                      shouldValidate: true,
                    });
                  if (detected.city)
                    setValue("city", detected.city, { shouldValidate: true });
                  if (detected.postcode)
                    setValue("postcode", detected.postcode, {
                      shouldValidate: true,
                    });
                  setLocationDetected(true);
                }
              } catch (e) {
                console.warn("[addPhotos] Location/geocoding failed:", e);
              }
            }
          }
        } else {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission required",
              "Photo library access is needed to add photos.",
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.3,
            selectionLimit: 10,
            base64: true,
            exif: false,
          });
          if (!result.canceled) appendAssets(result.assets);
        }
      },
    );
  };

  const removeAsset = (uri: string) => {
    setAssets((prev) => prev.filter((a) => a.uri !== uri));
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const values = getValues();
      const images = assets
        .slice(0, 3)
        .filter((a) => a.base64)
        .map((a) => ({
          base64: a.base64!,
          mimeType: a.mimeType ?? "image/jpeg",
        }));

      const result = await generateListingContent(supabase, {
        ...values,
        images,
      });
      setValue("title", result.title, { shouldValidate: true });
      setValue("description", result.description, { shouldValidate: true });
    } catch {
      Alert.alert(
        "Error",
        "Failed to generate listing content. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: AddNewProperty) => {
    // Validate declaration before touching the network
    if (!declarationType) {
      Alert.alert(
        "Declaration required",
        "Please complete the Surveillance Declaration before creating your listing.",
      );
      return;
    }
    if (
      declarationType === "external_only" &&
      !externalDevicesDescription.trim()
    ) {
      Alert.alert(
        "Description required",
        "Please describe your external surveillance devices and their locations.",
      );
      return;
    }
    if (!declarationConfirmed) {
      Alert.alert(
        "Confirmation required",
        "Please confirm the accuracy of your Surveillance Declaration.",
      );
      return;
    }

    try {
      const created = await createProperty({
        ...data,
        landlord_id: profile?.id,
        is_available: isAvailable,
      });

      // Save the surveillance declaration
      const { error: declarationError } = await supabase
        .from("property_surveillance_declarations")
        .upsert(
          {
            property_id: created.id,
            landlord_id: profile?.id,
            declaration_type: declarationType,
            external_devices_description:
              declarationType === "external_only"
                ? externalDevicesDescription.trim()
                : null,
            declared_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property_id" },
        );

      if (declarationError) throw declarationError;

      if (created?.id && assets.length > 0) {
        await uploadPropertyImages(created.id, assets);

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
            setDeclarationType(null);
            setExternalDevicesDescription("");
            setDeclarationConfirmed(false);
            router.replace("/");
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create property.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoGrid}>
            {/* Selected thumbnails */}
            {assets.map((a) => (
              <ImageBackground
                key={a.uri}
                source={{ uri: a.uri }}
                style={styles.thumbWrapper}
                imageStyle={styles.thumbImage}
              >
                <View style={styles.removeBtn}>
                  <Pressable
                    onPress={() => removeAsset(a.uri)}
                    style={styles.removeBtnPressable}
                    accessibilityLabel="Remove photo"
                  >
                    {({ pressed }) => (
                      <View style={[styles.removeBtnInner, pressed && { opacity: 0.6 }]}>
                        <MaterialIcons name="close" size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                </View>
              </ImageBackground>
            ))}

            {/* Add tile */}
            <View style={styles.addTileOuter}>
              <Pressable
                onPress={addPhotos}
                style={styles.addTilePressable}
                accessibilityLabel="Add photos"
              >
                {({ pressed }) => (
                  <View
                    style={[styles.addTileInner, pressed && { opacity: 0.7 }]}
                  >
                    <MaterialIcons
                      name="add-photo-alternate"
                      size={32}
                      color={theme.textSecondary}
                    />
                    <Text style={styles.addTileText}>Add photos</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
          <Text style={styles.photoHint}>
            Up to 10 photos. The first photo will be used as the cover.
          </Text>

          <Pressable
            onPress={generateWithAI}
            disabled={isGenerating || assets.length === 0}
            style={({ pressed }) => [
              styles.generateButton,
              pressed && assets.length > 0 && { opacity: 0.7 },
              (isGenerating || assets.length === 0) &&
                styles.generateButtonDisabled,
            ]}
            accessibilityLabel="Generate title and description with AI"
          >
            {isGenerating ? (
              <ActivityIndicator
                size="small"
                color={assets.length > 0 ? theme.primary : theme.muted}
              />
            ) : (
              <MaterialIcons
                name="auto-awesome"
                size={16}
                color={assets.length > 0 ? theme.primary : theme.muted}
              />
            )}
            <Text
              style={[
                styles.generateButtonText,
                assets.length === 0 && styles.generateButtonTextDisabled,
              ]}
            >
              {isGenerating ? "Generating…" : "Generate title & description"}
            </Text>
          </Pressable>
          {assets.length === 0 && (
            <Text style={styles.generateHint}>
              Add photos above to generate
            </Text>
          )}
        </View>

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

          {locationDetected && (
            <Text style={styles.locationDetectedHint}>
              Address detected from your location — edit if needed
            </Text>
          )}

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

          <Controller
            control={control}
            name="max_guests"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Max Guests"
                placeholder="e.g., 4"
                keyboardType="numeric"
                onChangeText={(text) => onChange(Number(text) || 0)}
                onBlur={onBlur}
                value={value?.toString() ?? ""}
                errorMessage={errors.max_guests?.message}
                style={styles.input}
              />
            )}
          />

          <View style={styles.availabilityContainer}>
            <View style={styles.availabilityLabel}>
              <MaterialIcons
                name={isAvailable ? "check-circle" : "cancel"}
                size={20}
                color={isAvailable ? theme.success : theme.muted}
              />
              <Text style={styles.availabilityText}>Available for Rent</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{
                false: theme.border,
                true: theme.primaryLight,
              }}
              thumbColor={isAvailable ? theme.primary : theme.muted}
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
          <SurveillanceDeclarationSection
            declarationType={declarationType}
            onDeclarationTypeChange={setDeclarationType}
            externalDevicesDescription={externalDevicesDescription}
            onExternalDevicesDescriptionChange={setExternalDevicesDescription}
            confirmed={declarationConfirmed}
            onConfirmedChange={setDeclarationConfirmed}
          />
        </View>

        <Button
          title="Create Property"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || !isDeclarationValid}
          loading={isSubmitting}
          buttonStyle={styles.submitButton}
          testID="create-property-button"
        />
      </View>
    </ScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
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
      color: t.text,
      marginTop: 12,
    },
    subtitle: {
      fontSize: 20,
      color: t.textSecondary,
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
      color: t.text,
      marginBottom: 16,
    },
    input: {
      backgroundColor: t.surface,
      borderColor: t.border,
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
      backgroundColor: t.surface,
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
      color: t.text,
    },
    submitButton: {
      marginTop: 8,
      backgroundColor: t.primary,
      borderRadius: 12,
    },
    photoGrid: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 12,
    },
    addTileOuter: {
      flex: 1,
      width: 96,
      height: 96,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: t.muted,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    addTilePressable: {
      flex: 1,
    },
    addTileInner: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    addTileText: {
      fontSize: 11,
      color: t.textSecondary,
      fontWeight: "500",
    },
    thumbWrapper: {
      minWidth: 96,
      height: 96,
      flex: 1,
      borderRadius: 12,
      backgroundColor: t.surface,
      overflow: "hidden",
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    thumbImage: {
      borderRadius: 12,
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: t.overlay,
    },
    removeBtnPressable: {
      flex: 1,
    },
    removeBtnInner: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    photoHint: {
      marginBottom: 12,
      fontSize: 12,
      color: t.textSecondary,
    },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.primary,
      backgroundColor: t.surface,
    },
    generateButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: t.primary,
    },
    generateButtonDisabled: {
      borderColor: t.border,
      opacity: 0.5,
    },
    generateButtonTextDisabled: {
      color: t.muted,
    },
    generateHint: {
      marginTop: 6,
      fontSize: 12,
      color: t.textSecondary,
    },
    locationDetectedHint: {
      fontSize: 12,
      color: t.primary,
      marginBottom: 12,
    },
  });
}

import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import {
  getRoleColor,
  getRoleIcon,
  handleProfileSave,
} from "@/utils/profile-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { profile, signOut, signingOut, refreshProfile } = useAuthStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
  });
  const isLandlord = profile?.user_role === "landlord";

  // Sync form data when profile changes (and not editing)
  useEffect(() => {
    if (!isEditing && profile) {
      setFormData((prev) => {
        const next = {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
        };
        // Avoid unnecessary state updates
        const same =
          prev.first_name === next.first_name &&
          prev.last_name === next.last_name &&
          prev.email === next.email &&
          prev.phone === next.phone;
        return same ? prev : next;
      });
    }
  }, [profile, isEditing]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await handleProfileSave(
        formData.first_name,
        formData.last_name,
        formData.phone,
        profile!.id
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Error", "Failed to save profile changes.");
    } finally {
      await refreshProfile();
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    });
    setIsEditing(false);
  };

  const onRefresh = async () => {
    setLoading(true);
    await refreshProfile();
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={colours.primary}
          colors={[colours.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View
            style={[styles.avatar, { backgroundColor: colours.primaryLight }]}
          >
            <MaterialIcons name="person" size={48} color={colours.primary} />
          </View>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(profile?.user_role) },
            ]}
          >
            <MaterialIcons
              name={getRoleIcon(profile?.user_role) as any}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.roleText}>
              {profile?.user_role?.toUpperCase() || "USER"}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <MaterialIcons name="edit" size={20} color={colours.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.form}>
          <Input
            label="First Name"
            placeholder="Enter first name"
            value={formData.first_name}
            onChangeText={(text) =>
              setFormData({ ...formData, first_name: text })
            }
            editable={isEditing}
            style={[styles.input, !isEditing && styles.disabledInput]}
          />

          <Input
            label="Last Name"
            placeholder="Enter last name"
            value={formData.last_name}
            onChangeText={(text) =>
              setFormData({ ...formData, last_name: text })
            }
            editable={isEditing}
            style={[styles.input, !isEditing && styles.disabledInput]}
          />

          <Input
            label="Email"
            placeholder="Enter email"
            value={formData.email}
            editable={false}
            style={[styles.input, styles.disabledInput]}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone Number"
            placeholder="Enter phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            editable={isEditing}
            style={[styles.input, !isEditing && styles.disabledInput]}
            keyboardType="phone-pad"
          />
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              type="outline"
              buttonStyle={styles.cancelButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              buttonStyle={styles.saveButton}
            />
          </View>
        )}
      </View>

      {/* My Stuff */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Stuff</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/bookings")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons
              name="calendar-today"
              size={24}
              color={colours.text}
            />
            <Text style={styles.menuItemText}>My Bookings</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colours.muted} />
        </TouchableOpacity>

        {/* My Listings - Only for Landlords */}
        {isLandlord && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/properties")}
          >
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="home" size={24} color={colours.text} />
              <Text style={styles.menuItemText}>My Properties</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colours.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="lock" size={24} color={colours.text} />
            <Text style={styles.menuItemText}>Change Password</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colours.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons
              name="notifications"
              size={24}
              color={colours.text}
            />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colours.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="help" size={24} color={colours.text} />
            <Text style={styles.menuItemText}>Help & Support</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colours.muted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
          disabled={signingOut}
        >
          <MaterialIcons name="logout" size={20} color={colours.danger} />
          <Text style={styles.signOutText}>
            {signingOut ? "Signing Out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
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
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: colours.primary,
    fontWeight: "500",
  },
  propertyWrapper: {
    marginBottom: 12,
  },
  propertyActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  propertyActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colours.primary,
  },
  dangerText: {
    color: colours.danger,
  },
  viewAllButton: {
    marginTop: 8,
    borderColor: colours.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colours.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  createButton: {
    marginTop: 16,
    minWidth: 200,
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderRadius: 12,
  },
  disabledInput: {
    backgroundColor: colours.background,
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderColor: colours.muted,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colours.primary,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colours.text,
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colours.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.danger,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.danger,
  },
});

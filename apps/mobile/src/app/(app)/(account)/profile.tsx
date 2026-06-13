import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useAuthStore } from "@/store/auth-store";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { getRoleColor, getRoleIcon, handleProfileSave } from "@/utils/profile-utils";
import { fetchServiceOperatorProfile, upsertServiceOperatorProfile } from "@/utils/service-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { validatePhone, normalisePhone } from "@/utils/phone-utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile, refreshProfile } = useAuthStore();
  const { keyboardOffset } = useKeyboardOffset();
  const isOperator = profile?.user_role === "service_operator";

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name:  profile?.last_name  || "",
    email:      profile?.email      || "",
    phone:      profile?.phone      || "",
  });

  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!isEditing && profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name:  profile.last_name  || "",
        email:      profile.email      || "",
        phone:      profile.phone      || "",
      });
    }
  }, [profile, isEditing]);

  useEffect(() => {
    if (isOperator && profile?.id) {
      fetchServiceOperatorProfile(profile.id).then((op) => {
        setCompanyName(op?.company_name ?? "");
        setBio(op?.bio ?? "");
      });
    }
  }, [isOperator, profile?.id]);

  const handleSaveBusiness = async () => {
    if (!profile?.id) return;
    setSavingBusiness(true);
    const { error } = await upsertServiceOperatorProfile(profile.id, {
      company_name: companyName.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    setSavingBusiness(false);
    if (error) {
      Alert.alert("Error", "Failed to save business info.");
    } else {
      setIsEditingBusiness(false);
    }
  };

  const handleSave = async () => {
    const error = validatePhone(formData.phone);
    if (error) { setPhoneError(error); return; }
    setLoading(true);
    try {
      await handleProfileSave(
        formData.first_name,
        formData.last_name,
        normalisePhone(formData.phone) ?? formData.phone,
        profile!.id,
      );
      setPhoneError(null);
      setIsEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save profile changes.");
    } finally {
      await refreshProfile();
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name:  profile?.last_name  || "",
      email:      profile?.email      || "",
      phone:      profile?.phone      || "",
    });
    setPhoneError(null);
    setIsEditing(false);
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardOffset}
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={async () => { setLoading(true); await refreshProfile(); setLoading(false); }}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      {/* Avatar + name + role badge */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <MaterialIcons name="person" size={48} color={theme.primary} />
          </View>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile?.user_role) }]}>
            <MaterialIcons name={getRoleIcon(profile?.user_role) as any} size={14} color="#FFFFFF" />
            <Text style={styles.roleText}>{profile?.user_role?.toUpperCase() || "USER"}</Text>
          </View>
        </View>
        <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
        <Text style={styles.emailText}>{profile?.email}</Text>
      </View>

      {/* Personal information — the only purpose of this screen */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
              <MaterialIcons name="edit" size={18} color={theme.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.form}>
          <Input
            label="First Name"
            placeholder="Enter first name"
            value={formData.first_name}
            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
            editable={isEditing}
            style={[styles.input, !isEditing && styles.disabledInput]}
          />
          <Input
            label="Last Name"
            placeholder="Enter last name"
            value={formData.last_name}
            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
            editable={isEditing}
            style={[styles.input, !isEditing && styles.disabledInput]}
          />
          <Input
            label="Email"
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
            errorMessage={isEditing ? (phoneError ?? undefined) : undefined}
          />
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={handleCancel} type="outline" buttonStyle={styles.cancelBtn} />
            <Button title="Save Changes" onPress={handleSave} loading={loading} buttonStyle={styles.saveBtn} />
          </View>
        )}
      </View>

      {isOperator && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Information</Text>
            {!isEditingBusiness && (
              <TouchableOpacity onPress={() => setIsEditingBusiness(true)} style={styles.editBtn}>
                <MaterialIcons name="edit" size={18} color={theme.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.form}>
            <Input
              label="Company / Trading Name"
              placeholder="e.g. Smith Cleaning Services"
              value={companyName}
              onChangeText={setCompanyName}
              editable={isEditingBusiness}
              style={[styles.input, !isEditingBusiness && styles.disabledInput]}
              autoCapitalize="words"
            />
            <Input
              label="Description"
              placeholder="A short description of your experience and services..."
              value={bio}
              onChangeText={setBio}
              editable={isEditingBusiness}
              style={[styles.input, styles.bioInput, !isEditingBusiness && styles.disabledInput]}
              multiline
              numberOfLines={4}
            />
          </View>
          {isEditingBusiness && (
            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                onPress={() => setIsEditingBusiness(false)}
                type="outline"
                buttonStyle={styles.cancelBtn}
              />
              <Button
                title="Save"
                onPress={handleSaveBusiness}
                loading={savingBusiness}
                buttonStyle={styles.saveBtn}
              />
            </View>
          )}
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    scrollView:    { flex: 1, backgroundColor: t.background },
    content:       { padding: 20, paddingBottom: 40 },
    header:        { alignItems: "center", marginBottom: 32 },
    avatarWrap:    { position: "relative", marginBottom: 16 },
    avatar:        { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
    roleBadge: {
      position: "absolute", bottom: 0, right: 0,
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4,
    },
    roleText:      { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
    name:          { fontSize: 24, fontWeight: "700", color: t.text, marginBottom: 4 },
    emailText:     { fontSize: 14, color: t.textSecondary },
    section:       { marginBottom: 24 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    sectionTitle:  { fontSize: 18, fontWeight: "600", color: t.text },
    editBtn:       { flexDirection: "row", alignItems: "center", gap: 4 },
    editBtnText:   { fontSize: 14, color: t.primary, fontWeight: "500" },
    form:          { gap: 8 },
    input:         { backgroundColor: t.surface, borderColor: t.border, borderRadius: 12 },
    disabledInput: { backgroundColor: t.background, opacity: 0.7 },
    buttonRow:     { flexDirection: "row", gap: 12, marginTop: 16 },
    cancelBtn:     { flex: 1, borderColor: t.muted },
    saveBtn:       { flex: 1, backgroundColor: t.primary },
    bioInput:      { height: 100, paddingTop: 12 },
  });
}

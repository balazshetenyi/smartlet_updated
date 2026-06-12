"use client";

import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@kiado/shared/services/profile-service";
import { validatePhone } from "@kiado/shared/lib/phone-utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export default function ProfileForm({ id, firstName, lastName, phone, email }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName, lastName, phone });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const phoneError = validatePhone(form.phone);
  const dirty =
    form.firstName !== firstName ||
    form.lastName !== lastName ||
    form.phone !== phone;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await updateProfile(supabase, id, form);
    setSaving(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" value={form.firstName} onChange={set("firstName")} />
        <Field label="Last name" value={form.lastName} onChange={set("lastName")} />
      </div>
      <Field
        label="Phone"
        value={form.phone}
        onChange={set("phone")}
        type="tel"
        placeholder="07911 123456"
        error={form.phone ? phoneError ?? undefined : undefined}
      />
      <Field label="Email" value={email} readOnly />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated.</p>}

      <button
        type="submit"
        disabled={saving || !dirty || !!phoneError}
        className="bg-[#7C6CFF] hover:bg-[#6B5CE7] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
  error,
}: {
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`px-3.5 py-2.5 rounded-xl border text-sm text-[#2C3E50] outline-none transition-colors ${
          readOnly
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
            : "bg-white border-gray-200 focus:border-[#7C6CFF]"
        } ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

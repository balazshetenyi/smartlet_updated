"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: form.newPassword });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setForm({ newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="New password" value={form.newPassword} onChange={set("newPassword")} type="password" placeholder="Min. 8 characters" />
      <Field label="Confirm new password" value={form.confirmPassword} onChange={set("confirmPassword")} type="password" placeholder="Repeat new password" />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Password updated.</p>}

      <button
        type="submit"
        disabled={saving || !form.newPassword || !form.confirmPassword}
        className="bg-[#7C6CFF] hover:bg-[#6B5CE7] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#2C3E50] outline-none transition-colors focus:border-[#7C6CFF] bg-white"
      />
    </div>
  );
}

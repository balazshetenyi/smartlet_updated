import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./_components/ProfileForm";
import ChangePasswordForm from "./_components/ChangePasswordForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, email")
    .eq("id", user!.id)
    .single();

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C3E50]">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your personal details</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <ProfileForm
          id={user!.id}
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          phone={profile?.phone ?? ""}
          email={profile?.email ?? user?.email ?? ""}
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-[#2C3E50] mb-5">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

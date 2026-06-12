import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./_components/Sidebar";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/landlord/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        email={user.email}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

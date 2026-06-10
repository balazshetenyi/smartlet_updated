"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarClock,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import SignOutButton from "./SignOutButton";

const navItems = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/landlord/properties", label: "Properties", icon: Building2 },
  { href: "/landlord/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/landlord/messages", label: "Messages", icon: MessageSquare },
  { href: "/landlord/earnings", label: "Earnings", icon: TrendingUp },
];

interface SidebarProps {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export default function Sidebar({ firstName, lastName, email }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#2C3E50] flex flex-col flex-shrink-0 h-screen sticky top-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-white text-xl font-bold tracking-tight">Kiado</h1>
        <p className="text-white/50 text-xs mt-0.5">Landlord Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-[#7C6CFF] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#7C6CFF] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {firstName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {firstName} {lastName}
            </p>
            <p className="text-white/40 text-xs truncate">{email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}

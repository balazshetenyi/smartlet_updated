import { createClient } from "@/lib/supabase/server";
import { fetchLandlordReports } from "@kiado/shared/services/surveillance-service";
import { ShieldAlert, ShieldCheck, ShieldOff, Clock, Shield } from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    classes: "bg-amber-100 text-amber-700",
  },
  investigating: {
    label: "Investigating",
    icon: ShieldAlert,
    classes: "bg-orange-100 text-orange-700",
  },
  resolved_breach: {
    label: "Breach Confirmed",
    icon: ShieldOff,
    classes: "bg-red-100 text-red-700",
  },
  resolved_no_breach: {
    label: "No Breach Found",
    icon: ShieldCheck,
    classes: "bg-green-100 text-green-700",
  },
} as const;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reports = await fetchLandlordReports(supabase, user!.id);

  const open = reports.filter(
    (r) => r.status === "pending" || r.status === "investigating",
  );
  const resolved = reports.filter(
    (r) => r.status === "resolved_breach" || r.status === "resolved_no_breach",
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Surveillance reports filed against your properties
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center gap-3 text-center">
          <Shield size={44} className="text-gray-200" />
          <p className="text-gray-500 font-medium">No reports filed</p>
          <p className="text-gray-400 text-sm">
            Surveillance reports against your properties will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Open · {open.length}
              </h2>
              <div className="space-y-3">
                {open.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Resolved · {resolved.length}
              </h2>
              <div className="space-y-3">
                {resolved.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: Awaited<ReturnType<typeof fetchLandlordReports>>[number] }) {
  const config = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-[#2C3E50] truncate">
              {report.property?.title ?? "Unknown property"}
            </p>
            {report.property?.city && (
              <span className="text-xs text-gray-400 shrink-0">
                {report.property.city}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{report.description}</p>
          {report.resolution_notes && (
            <p className="text-sm text-gray-400 mt-2 italic">
              Resolution: {report.resolution_notes}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.classes}`}
          >
            <Icon size={12} />
            {config.label}
          </span>
          <p className="text-xs text-gray-400 mt-1.5">
            Filed {formatDate(report.created_at)}
          </p>
          {report.resolved_at && (
            <p className="text-xs text-gray-400">
              Resolved {formatDate(report.resolved_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

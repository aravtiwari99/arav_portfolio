import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import VisitorHistory from "@/components/VisitorHistory";
import { isAuthenticated } from "@/lib/adminAuth";
import { getVisitorHistory } from "@/lib/locationStore";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const dashboardUrl = process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || "https://cloud.umami.is";
  const history = await getVisitorHistory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between border-b border-matrix-green/30 pb-4">
        <div>
          <p className="text-xs text-matrix-green/60">ARAV SYSTEMS / PRIVATE</p>
          <h1 className="glow-text text-2xl font-bold">Analytics Dashboard</h1>
        </div>
        <LogoutButton />
      </div>
      <section className="mt-8 border border-matrix-green/40 p-6 glow-border">
        <h2 className="mb-3 text-lg font-bold">Visitor statistics</h2>
        <p className="text-sm text-matrix-green/70">Open Umami to view page views, visits, devices, countries, and referral sources. Visitor IP addresses are not exposed here.</p>
        <a href={dashboardUrl} target="_blank" rel="noreferrer" className="mt-6 inline-block border border-matrix-green px-4 py-2 text-sm hover:bg-matrix-green hover:text-black">Open Umami</a>
      </section>
      <VisitorHistory history={history} />
      <ChangePasswordForm />
    </main>
  );
}

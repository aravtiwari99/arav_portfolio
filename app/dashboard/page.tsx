import { redirect } from "next/navigation";
import VisitorHistory from "@/components/VisitorHistory";
import { isAuthenticated } from "@/lib/adminAuth";
import { getVisitorHistory } from "@/lib/locationStore";
import AdminInbox from "@/components/AdminInbox";
import DashboardTabs from "@/components/DashboardTabs";
import ProfileMenu from "@/components/ProfileMenu";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const history = await getVisitorHistory();

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto max-w-5xl px-4 pb-5">
        <div>
          <p className="text-xs text-matrix-green/60">ARAV SYSTEMS / PRIVATE</p>
          <h1 className="glow-text text-2xl font-bold">Analytics Dashboard</h1>
        </div>
      </div>
      <DashboardTabs
        visitors={<VisitorHistory history={history} />}
        messages={<AdminInbox view="messages" />}
        calls={<AdminInbox view="calls" />}
        profile={<ProfileMenu />}
      />
    </main>
  );
}

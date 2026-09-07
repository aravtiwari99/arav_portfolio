import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { isAuthenticated } from "@/lib/adminAuth";
import { getVisitorHistory } from "@/lib/locationStore";

export default function DashboardPage() {
  if (!isAuthenticated()) redirect("/login");
  const dashboardUrl = process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || "https://cloud.umami.is";
  const history = getVisitorHistory();

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
      <section className="mt-8 border border-matrix-green/40 p-6 glow-border">
        <h2 className="mb-3 text-lg font-bold">Visitor history</h2>
        <p className="mb-4 text-sm text-matrix-green/70">
          {history.length} visit{history.length === 1 ? "" : "s"} recorded. Location appears only after browser consent.
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-matrix-green/70">No visits recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map((visit) => (
              <article key={visit.id} className="border border-matrix-green/20 p-4 text-sm text-matrix-green/80">
                <p>Visited: {new Date(visit.visitedAt).toLocaleString()}</p>
                {visit.location ? (
                  <>
                    <p>Latitude: {visit.location.latitude.toFixed(6)}</p>
                    <p>Longitude: {visit.location.longitude.toFixed(6)}</p>
                    <p>Accuracy: approximately {Math.round(visit.location.accuracy)} m</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${visit.location.latitude},${visit.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block border border-matrix-green px-4 py-2 text-matrix-green hover:bg-matrix-green hover:text-black"
                    >
                      Open location in Google Maps
                    </a>
                  </>
                ) : (
                  <p className="mt-1 text-matrix-green/60">Location not shared.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <ChangePasswordForm />
    </main>
  );
}

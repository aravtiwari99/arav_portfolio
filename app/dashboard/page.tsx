import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { getLatestVisitorLocation } from "@/lib/locationStore";

function isAuthenticated() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const session = cookies().get("arav_admin_session")?.value;
  if (!username || !password || !session) return false;
  const expected = createHmac("sha256", password).update(username).digest("hex");
  const received = Buffer.from(session);
  const expectedBuffer = Buffer.from(expected);
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export default function DashboardPage() {
  if (!isAuthenticated()) redirect("/login");
  const dashboardUrl = process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || "https://cloud.umami.is";
  const location = getLatestVisitorLocation();

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
        <h2 className="mb-3 text-lg font-bold">Latest consented location</h2>
        {location ? (
          <div className="space-y-1 text-sm text-matrix-green/80">
            <p>Latitude: {location.latitude.toFixed(6)}</p>
            <p>Longitude: {location.longitude.toFixed(6)}</p>
            <p>Accuracy: approximately {Math.round(location.accuracy)} m</p>
            <p>Recorded: {new Date(location.recordedAt).toLocaleString()}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block border border-matrix-green px-4 py-2 text-sm text-matrix-green hover:bg-matrix-green hover:text-black"
            >
              Open this location in Google Maps
            </a>
          </div>
        ) : (
          <p className="text-sm text-matrix-green/70">No visitor has granted location permission yet.</p>
        )}
      </section>
    </main>
  );
}

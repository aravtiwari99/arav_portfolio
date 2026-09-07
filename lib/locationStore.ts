export interface VisitorLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  recordedAt: string;
}

declare global {
  // Keep the latest consented location available across development reloads.
  var latestVisitorLocation: VisitorLocation | undefined;
}

export function saveVisitorLocation(location: VisitorLocation) {
  globalThis.latestVisitorLocation = location;
}

export function getLatestVisitorLocation() {
  return globalThis.latestVisitorLocation;
}

export interface VisitorLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  recordedAt: string;
}

export interface VisitorRecord {
  id: string;
  visitedAt: string;
  location?: VisitorLocation;
}

declare global {
  // Keep the latest consented location available across development reloads.
  var latestVisitorLocation: VisitorLocation | undefined;
  var visitorHistory: VisitorRecord[] | undefined;
}

function getHistory() {
  globalThis.visitorHistory ??= [];
  return globalThis.visitorHistory;
}

export function recordVisit(id: string) {
  const history = getHistory();
  const existing = history.find((record) => record.id === id);
  if (existing) return existing;

  const record = { id, visitedAt: new Date().toISOString() };
  history.unshift(record);
  globalThis.latestVisitorLocation = undefined;
  return record;
}

export function saveVisitorLocation(id: string, location: VisitorLocation) {
  const record = getHistory().find((entry) => entry.id === id);
  if (!record) return false;
  record.location = location;
  globalThis.latestVisitorLocation = location;
  return true;
}

export function getVisitorHistory() {
  return getHistory();
}

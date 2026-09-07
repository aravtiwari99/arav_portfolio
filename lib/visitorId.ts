const VISITOR_ID_KEY = "arav_visitor_id";

export function getVisitorId() {
  const existing = sessionStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

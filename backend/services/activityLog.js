const events = [];
const LIMIT = 500;

export function recordActivity(event) {
  events.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: new Date().toISOString(), ...event });
  if (events.length > LIMIT) events.length = LIMIT;
}

export function recentActivity(limit = 100) {
  return events.slice(0, Math.max(1, Math.min(Number(limit) || 100, 200)));
}

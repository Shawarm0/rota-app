import type { DashboardData } from "../api/dashboard.api";

export type ActivityEntry = DashboardData["recentActivity"][number];

export function formatActivityDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - date.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatActivityTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

interface ShiftSnapshot {
  assignee: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

function shortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function describeShift(s: ShiftSnapshot) {
  return `${shortDate(s.date)}, ${s.startTime}–${s.endTime}${s.location ? ` at ${s.location}` : ""}`;
}

function whoseShift(s: ShiftSnapshot) {
  return s.assignee ? `${s.assignee}'s shift` : "an open shift";
}

// Lists what changed between two versions of a shift
function describeShiftChanges(before: ShiftSnapshot, after: ShiftSnapshot) {
  const changes: string[] = [];
  if (before.date !== after.date) changes.push(`${shortDate(before.date)} → ${shortDate(after.date)}`);
  if (before.startTime !== after.startTime || before.endTime !== after.endTime) {
    changes.push(`${before.startTime}–${before.endTime} → ${after.startTime}–${after.endTime}`);
  }
  if (before.assignee !== after.assignee) changes.push(`${before.assignee ?? "Open"} → ${after.assignee ?? "Open"}`);
  if (before.location !== after.location) changes.push(`${before.location ?? "No location"} → ${after.location ?? "No location"}`);
  const prefix = before.date === after.date ? `${shortDate(after.date)}: ` : "";
  return changes.length > 0 ? prefix + changes.join(", ") : `${describeShift(after)} (notes updated)`;
}

// Turns a log entry into a plain sentence, e.g. "edited Alice's shift"
export function describeActivity(log: ActivityEntry) {
  const d = log.details;
  if (log.action === "ADD_ADDITIONAL" && d?.date) {
    return {
      summary: d.assignee ? `added an additional shift for ${d.assignee}` : "added an open shift",
      detail: describeShift(d as unknown as ShiftSnapshot),
    };
  }
  if (log.action === "EDIT_SHIFT" && d?.before && d?.after) {
    const before = d.before as ShiftSnapshot;
    return { summary: `edited ${whoseShift(before)}`, detail: describeShiftChanges(before, d.after as ShiftSnapshot) };
  }
  if (log.action === "DELETE_SHIFT" && d?.date) {
    const shift = d as unknown as ShiftSnapshot;
    return { summary: `deleted ${whoseShift(shift)}`, detail: describeShift(shift) };
  }
  if (log.action === "REQUEST_COVER" && d?.date) {
    const notified = Number(d.notified ?? 0);
    return {
      summary: "requested cover for a shift",
      detail: `${describeShift(d as unknown as ShiftSnapshot)} · ${notified} ${notified === 1 ? "person" : "people"} notified`,
    };
  }
  if ((log.action === "APPROVE_CROSS_STORE" || log.action === "REJECT_CROSS_STORE") && d?.name) {
    const approved = log.action === "APPROVE_CROSS_STORE";
    return {
      summary: `${approved ? "approved" : "rejected"} ${d.name} working at another store`,
      detail: `${d.when}${approved ? "" : " · now open for cover"}`,
    };
  }
  return { summary: `${log.action.toLowerCase()} ${log.entity.toLowerCase()}`, detail: null };
}

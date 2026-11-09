function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Length of a shift in minutes. An end time at or before the start time means the shift runs past midnight.
export function shiftMinutes(startTime: string, endTime: string) {
  const minutes = toMinutes(endTime) - toMinutes(startTime);
  return minutes > 0 ? minutes : minutes + 24 * 60;
}

// Rounded for display only; always add up minutes first so rounding doesn't accumulate
export function minutesToHours(minutes: number) {
  return Math.round((minutes / 60) * 100) / 100;
}

// Monday (UTC midnight) of the week containing the given YYYY-MM-DD date, matching how shift dates are stored
export function weekBounds(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

// Totals for a set of worked shifts. Rota shifts are ASSIGNED; extra shifts are ADDITIONAL (claimed from the
// shift pot, covers and additional shifts). Open (AVAILABLE) shifts aren't worked, so they're ignored.
export function summariseShifts(shifts: { status: string; startTime: string; endTime: string }[]) {
  let rotaMinutes = 0;
  let extraMinutes = 0;
  let rotaShifts = 0;
  let extraShifts = 0;
  for (const shift of shifts) {
    const minutes = shiftMinutes(shift.startTime, shift.endTime);
    if (shift.status === "ASSIGNED") {
      rotaShifts++;
      rotaMinutes += minutes;
    } else if (shift.status === "ADDITIONAL") {
      extraShifts++;
      extraMinutes += minutes;
    }
  }
  return { rotaShifts, extraShifts, rotaMinutes, extraMinutes, totalMinutes: rotaMinutes + extraMinutes };
}

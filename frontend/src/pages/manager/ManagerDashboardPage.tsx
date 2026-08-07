import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../../components/layout/TopBar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useDashboard, useEmployeeSummaries } from "../../hooks/useDashboard";
import { useHolidayRequests, useApproveHoliday, useRejectHoliday } from "../../hooks/useHolidays";
import { useCreateAdditionalShift } from "../../hooks/useShifts";
import { useUsers } from "../../hooks/useUsers";
import { useLocations } from "../../hooks/useLocations";
import { formatDate } from "../../lib/dateUtils";
import {
  Users, Palmtree, AlertCircle, BarChart3, Check, X, Plus, Search, Trash2, FileText,
} from "lucide-react";

interface AdditionalShiftForm {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
}

function getInitials(first: string, last: string) {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
}

function getTodayFormatted() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.getDate();
  const monName = mon.toLocaleDateString("en-GB", { month: "short" });
  const sunName = sun.toLocaleDateString("en-GB", { month: "short" });
  if (monName === sunName) return `Week of ${fmt(mon)}–${fmt(sun)} ${monName}`;
  return `Week of ${fmt(mon)} ${monName}–${fmt(sun)} ${sunName}`;
}

function formatActivityDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - date.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatActivityTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getActivityStyle(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("delete") || lower.includes("reject"))
    return { bg: "bg-red-50", color: "text-red-500", Icon: Trash2 };
  if (lower.includes("approv"))
    return { bg: "bg-green-50", color: "text-green-600", Icon: Check };
  return { bg: "bg-green-50", color: "text-green-600", Icon: FileText };
}

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: employees } = useEmployeeSummaries();
  const { data: holidays } = useHolidayRequests("PENDING");
  const { data: allEmployees } = useUsers("EMPLOYEE");
  const { data: locations } = useLocations();
  const approveHoliday = useApproveHoliday();
  const rejectHoliday = useRejectHoliday();
  const createAdditionalShift = useCreateAdditionalShift();
  const [showAddShift, setShowAddShift] = useState(false);
  const [empFilter, setEmpFilter] = useState("");
  const shiftForm = useForm<AdditionalShiftForm>();

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    const q = empFilter.toLowerCase();
    return q
      ? employees.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q))
      : employees;
  }, [employees, empFilter]);

  const groupedActivity = useMemo(() => {
    if (!dashboard?.recentActivity) return [];
    const groups: Record<string, typeof dashboard.recentActivity> = {};
    for (const log of dashboard.recentActivity.slice(0, 15)) {
      const key = formatActivityDate(log.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    }
    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }, [dashboard?.recentActivity]);

  const totalHours = employees ? employees.reduce((s, e) => s + e.totalHours, 0) : 0;
  const totalAdditionalHours = employees ? employees.reduce((s, e) => s + e.additionalHours, 0) : 0;

  if (isLoading) {
    return (
      <>
        <TopBar title="Manager Dashboard" subtitle={getTodayFormatted()} />
        <div className="flex justify-center py-12"><Spinner /></div>
      </>
    );
  }

  const kpis = [
    {
      label: "Pending Holidays",
      value: dashboard?.pendingHolidays || 0,
      Icon: Palmtree,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      label: "Shifts to Cover",
      value: dashboard?.shiftsNeedingCover || 0,
      Icon: AlertCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      onClick: () => navigate("/manager/shifts-to-cover"),
    },
    {
      label: "Active Employees",
      value: dashboard?.totalEmployees || 0,
      Icon: Users,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
    },
    {
      label: "Labor Hours (wk)",
      value: `${Math.round((totalHours + totalAdditionalHours) * 10) / 10}h`,
      sub: totalAdditionalHours > 0 ? `+${Math.round(totalAdditionalHours * 10) / 10}h extra` : undefined,
      Icon: BarChart3,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <>
      <TopBar
        title="Manager Dashboard"
        subtitle={getTodayFormatted()}
        actions={
          <button
            onClick={() => setShowAddShift(true)}
            className="hidden sm:inline-flex items-center gap-[7px] rounded-lg bg-indigo-600 px-4 py-[9px] text-[13.5px] font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-[15px] w-[15px]" /> Additional Shift
          </button>
        }
      />
      <div className="p-4 md:px-7 md:py-5 flex flex-col gap-5 max-w-[1400px]">
        {/* Mobile add shift button */}
        <button
          onClick={() => setShowAddShift(true)}
          className="sm:hidden inline-flex items-center justify-center gap-[7px] rounded-lg bg-indigo-600 px-4 py-[9px] text-[13.5px] font-semibold text-white hover:bg-indigo-700 transition-colors w-full"
        >
          <Plus className="h-[15px] w-[15px]" /> Additional Shift
        </button>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, Icon, iconBg, iconColor, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              className={`bg-white border border-gray-200 rounded-xl px-5 py-[18px] ${onClick ? "cursor-pointer hover:border-gray-300 transition-colors" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-[0.04em]">{label}</div>
                  <div className="text-[30px] font-bold text-gray-900 mt-2 tracking-[-0.02em] leading-none">{value}</div>
                  {sub && <div className="text-[12px] text-amber-600 font-medium mt-1">{sub}</div>}
                </div>
                <div className={`h-9 w-9 rounded-[9px] ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Holiday Requests */}
        {holidays && holidays.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-[18px] border-b border-gray-100">
              <div className="text-[15px] font-bold text-gray-900">Pending Holiday Requests</div>
            </div>
            <div>
              {holidays.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-5 py-[13px] border-t first:border-t-0 border-gray-100">
                  <div className="flex items-center gap-[10px] min-w-0">
                    <div className="h-[30px] w-[30px] rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                      {getInitials(req.user?.firstName || "", req.user?.lastName || "")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-gray-900">{req.user?.firstName} {req.user?.lastName}</div>
                      <div className="text-[12px] text-gray-500">{formatDate(req.date)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => approveHoliday.mutate(req.id)} className="p-1.5 rounded-lg hover:bg-green-50 transition-colors">
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button onClick={() => rejectHoliday.mutate({ id: req.id })} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employee Summary */}
        {employees && employees.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-[18px] border-b border-gray-100 gap-3 flex-wrap">
              <div>
                <div className="text-[15px] font-bold text-gray-900">Employee Summary</div>
                <div className="text-[12.5px] text-gray-500 mt-0.5">{getWeekRange()}</div>
              </div>
              <div className="relative">
                <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400 pointer-events-none" />
                <input
                  value={empFilter}
                  onChange={(e) => setEmpFilter(e.target.value)}
                  placeholder="Search employees"
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] w-[180px] outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-[11px] text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.04em]">Employee</th>
                    <th className="text-right px-5 py-[11px] text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.04em]">Shifts</th>
                    <th className="text-right px-5 py-[11px] text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.04em]">Hours</th>
                    <th className="text-right px-5 py-[11px] text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.04em]">Extra</th>
                    <th className="text-right px-5 py-[11px] text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.04em]">Holidays</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="border-t border-gray-100">
                      <td className="px-5 py-[13px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="h-[30px] w-[30px] rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                            {getInitials(emp.firstName, emp.lastName)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[12px] text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-[13px] text-right text-gray-800">{emp.totalShifts}</td>
                      <td className="px-5 py-[13px] text-right text-gray-800 font-semibold">{emp.totalHours}h</td>
                      <td className="px-5 py-[13px] text-right">
                        {emp.additionalHours > 0
                          ? <span className="text-amber-600 font-medium">+{emp.additionalHours}h</span>
                          : <span className="text-gray-400">&mdash;</span>}
                      </td>
                      <td className="px-5 py-[13px] text-right text-gray-800">{emp.holidaysUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="px-5 py-[14px] border-t border-gray-100">
                  <div className="flex items-center gap-[10px] min-w-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-[14px]">{emp.firstName} {emp.lastName}</div>
                      <div className="text-[12px] text-gray-500">{emp.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-[18px] mt-[10px] text-[12.5px] text-gray-500">
                    <div><span className="text-gray-900 font-semibold">{emp.totalShifts}</span> shifts</div>
                    <div><span className="text-gray-900 font-semibold">{emp.totalHours}h</span></div>
                    {emp.additionalHours > 0 && <div className="text-amber-600">+{emp.additionalHours}h</div>}
                    <div><span className="text-gray-900 font-semibold">{emp.holidaysUsed}</span> hol.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {groupedActivity.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-[18px] border-b border-gray-100">
              <div className="text-[15px] font-bold text-gray-900">Recent Activity</div>
            </div>
            <div className="px-5 py-[6px]">
              {groupedActivity.map((group) => (
                <div key={group.date}>
                  <div className="text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.04em] pt-3 pb-[6px]">
                    {group.date}
                  </div>
                  {group.items.map((log) => {
                    const style = getActivityStyle(log.action);
                    return (
                      <div key={log.id} className="flex items-start gap-3 py-[10px] border-t border-gray-50">
                        <div className={`h-7 w-7 rounded-full ${style.bg} ${style.color} flex items-center justify-center flex-shrink-0 mt-[1px]`}>
                          <style.Icon className="h-[14px] w-[14px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] text-gray-700">
                            <span className="font-semibold text-gray-900">{log.user.firstName} {log.user.lastName}</span>{" "}
                            {log.action.toLowerCase()} {log.entity.toLowerCase()}
                          </div>
                          <div className="text-[12px] text-gray-400 mt-[2px]">{formatActivityTime(log.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAddShift} onClose={() => setShowAddShift(false)} title="Add Additional Shift">
        <form
          onSubmit={shiftForm.handleSubmit((data) => {
            createAdditionalShift.mutate(
              { ...data, location: data.location || undefined, notes: data.notes || undefined },
              { onSuccess: () => { setShowAddShift(false); shiftForm.reset(); } },
            );
          })}
          className="flex flex-col gap-4"
        >
          <Select
            id="userId"
            label="Employee"
            options={[
              { value: "", label: "Select employee..." },
              ...(allEmployees?.map((e) => ({
                value: e.id,
                label: `${e.firstName} ${e.lastName}${e.location ? ` (${e.location.name})` : ""}`,
              })) || []),
            ]}
            {...shiftForm.register("userId", { required: true })}
          />
          <Input id="date" label="Date" type="date" {...shiftForm.register("date", { required: true })} />
          <Input id="startTime" label="Start Time" type="time" {...shiftForm.register("startTime", { required: true })} />
          <Input id="endTime" label="End Time" type="time" {...shiftForm.register("endTime", { required: true })} />
          <Select
            id="location"
            label="Location"
            options={[
              { value: "", label: "No location" },
              ...(locations?.map((l) => ({ value: l.name, label: l.name })) || []),
            ]}
            {...shiftForm.register("location")}
          />
          <Input id="notes" label="Notes (optional)" {...shiftForm.register("notes")} />
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setShowAddShift(false)}>Cancel</Button>
            <Button type="submit" loading={createAdditionalShift.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

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

function initials(first: string, last: string) {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
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
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getActivityStyle(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("delete") || lower.includes("reject")) {
    return { bg: "bg-red-50", color: "text-red-500", Icon: Trash2 };
  }
  if (lower.includes("approv")) {
    return { bg: "bg-green-50", color: "text-green-600", Icon: Check };
  }
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

  if (isLoading) {
    return (
      <>
        <TopBar title="Manager Dashboard" />
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
      iconColor: "text-amber-600",
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
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Total Hours (wk)",
      value: employees
        ? `${employees.reduce((s, e) => s + e.totalHours, 0)}h`
        : "—",
      Icon: BarChart3,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <>
      <TopBar title="Manager Dashboard" />
      <div className="p-3 md:p-5 space-y-4 max-w-[1400px]">
        {/* Additional Shift button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddShift(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Additional Shift
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map(({ label, value, Icon, iconBg, iconColor, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              className={`bg-white border border-gray-200 rounded-xl p-4 ${onClick ? "cursor-pointer hover:border-gray-300 transition-colors" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
                  <div className="text-[28px] font-bold text-gray-900 mt-1.5 tracking-tight leading-none">{value}</div>
                </div>
                <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Holiday Requests */}
        {holidays && holidays.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-[14px] font-bold text-gray-900">Pending Holiday Requests</div>
            </div>
            <div className="divide-y divide-gray-100">
              {holidays.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                      {initials(req.user?.firstName || "", req.user?.lastName || "")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-gray-900 truncate">{req.user?.firstName} {req.user?.lastName}</div>
                      <div className="text-[12px] text-gray-500">{formatDate(req.date)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => approveHoliday.mutate(req.id)} className="p-1.5 rounded-md hover:bg-green-50 transition-colors">
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button onClick={() => rejectHoliday.mutate({ id: req.id })} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3 flex-wrap">
              <div>
                <div className="text-[14px] font-bold text-gray-900">Employee Summary</div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={empFilter}
                  onChange={(e) => setEmpFilter(e.target.value)}
                  placeholder="Search employees"
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-[13px] w-44 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Shifts</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Extra</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Holidays</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {initials(emp.firstName, emp.lastName)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[12px] text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">{emp.totalShifts}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-semibold">{emp.totalHours}h</td>
                      <td className="px-4 py-3 text-right">
                        {emp.additionalCount > 0
                          ? <span className="text-amber-600">+{emp.additionalCount}h</span>
                          : <span className="text-gray-400">&mdash;</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">{emp.holidaysUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {initials(emp.firstName, emp.lastName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-[13px] truncate">{emp.firstName} {emp.lastName}</div>
                        <div className="text-[12px] text-gray-500">{emp.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-[12px] text-gray-500">
                    <div><span className="font-semibold text-gray-900">{emp.totalShifts}</span> shifts</div>
                    <div><span className="font-semibold text-gray-900">{emp.totalHours}h</span></div>
                    {emp.additionalCount > 0 && (
                      <div className="text-amber-600">+{emp.additionalCount}h extra</div>
                    )}
                    <div><span className="font-semibold text-gray-900">{emp.holidaysUsed}</span> hol.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {groupedActivity.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-[14px] font-bold text-gray-900">Recent Activity</div>
            </div>
            <div className="px-4 py-1">
              {groupedActivity.map((group) => (
                <div key={group.date}>
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pt-3 pb-1.5">
                    {group.date}
                  </div>
                  {group.items.map((log) => {
                    const style = getActivityStyle(log.action);
                    return (
                      <div key={log.id} className="flex items-start gap-3 py-2.5 border-t border-gray-50">
                        <div className={`h-7 w-7 rounded-full ${style.bg} ${style.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <style.Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-gray-700">
                            <span className="font-semibold text-gray-900">{log.user.firstName} {log.user.lastName}</span>{" "}
                            {log.action.toLowerCase()} {log.entity.toLowerCase()}
                          </div>
                          <div className="text-[12px] text-gray-400 mt-0.5">{formatActivityTime(log.createdAt)}</div>
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
          className="space-y-4"
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
          <div className="grid grid-cols-2 gap-3">
            <Input id="startTime" label="Start Time" type="time" {...shiftForm.register("startTime", { required: true })} />
            <Input id="endTime" label="End Time" type="time" {...shiftForm.register("endTime", { required: true })} />
          </div>
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddShift(false)}>Cancel</Button>
            <Button type="submit" loading={createAdditionalShift.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

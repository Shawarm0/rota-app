import { useNavigate } from "react-router-dom";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { useDashboard, useEmployeeSummaries } from "../../hooks/useDashboard";
import { useHolidayRequests, useApproveHoliday, useRejectHoliday } from "../../hooks/useHolidays";
import { formatDate } from "../../lib/dateUtils";
import { Users, Palmtree, AlertCircle, Check, X } from "lucide-react";

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: employees } = useEmployeeSummaries();
  const { data: holidays } = useHolidayRequests("PENDING");
  const approveHoliday = useApproveHoliday();
  const rejectHoliday = useRejectHoliday();

  if (isLoading) {
    return (
      <>
        <TopBar title="Manager Dashboard" />
        <div className="flex justify-center py-12"><Spinner /></div>
      </>
    );
  }

  const stats = [
    { label: "Pending Holidays", value: dashboard?.pendingHolidays || 0, icon: Palmtree, color: "text-amber-600 bg-amber-50", onClick: undefined },
    { label: "Shifts to Cover", value: dashboard?.shiftsNeedingCover || 0, icon: AlertCircle, color: "text-red-600 bg-red-50", onClick: () => navigate("/manager/shifts-to-cover") },
    { label: "Active Employees", value: dashboard?.totalEmployees || 0, icon: Users, color: "text-blue-600 bg-blue-50", onClick: undefined },
  ];

  return (
    <>
      <TopBar title="Manager Dashboard" />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, color, onClick }) => (
            <Card
              key={label}
              className={onClick ? "cursor-pointer hover:ring-2 hover:ring-gray-200 transition-shadow" : ""}
              onClick={onClick}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {holidays && holidays.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pending Holiday Requests</h3>
            <div className="space-y-3">
              {holidays.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{req.user?.firstName} {req.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{formatDate(req.date)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => approveHoliday.mutate(req.id)} className="p-1.5 rounded-lg hover:bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button onClick={() => rejectHoliday.mutate({ id: req.id })} className="p-1.5 rounded-lg hover:bg-red-50">
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {employees && employees.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Employee Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium text-right">Shifts</th>
                    <th className="pb-2 font-medium text-right">Hours</th>
                    <th className="pb-2 font-medium text-right">Extra</th>
                    <th className="pb-2 font-medium text-right">Holidays</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{emp.firstName} {emp.lastName}</td>
                      <td className="py-2 text-right">{emp.totalShifts}</td>
                      <td className="py-2 text-right">{emp.totalHours}h</td>
                      <td className="py-2 text-right">{emp.additionalCount}</td>
                      <td className="py-2 text-right">{emp.holidaysUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {dashboard.recentActivity.slice(0, 10).map((log) => (
                <div key={log.id} className="text-sm py-1.5 border-b last:border-0">
                  <p className="text-gray-700">
                    <span className="font-medium">{log.user.firstName} {log.user.lastName}</span>{" "}
                    <span className="text-gray-500">{log.action.toLowerCase()}</span>{" "}
                    <span className="text-gray-500">{log.entity.toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

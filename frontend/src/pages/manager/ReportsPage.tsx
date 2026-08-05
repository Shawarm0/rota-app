import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import * as dashboardApi from "../../api/dashboard.api";
import { toDateString, addDays, getMonday } from "../../lib/dateUtils";
import { Download } from "lucide-react";

export function ReportsPage() {
  const now = new Date();
  const [from, setFrom] = useState(toDateString(addDays(getMonday(now), -28)));
  const [to, setTo] = useState(toDateString(now));

  const { data: report, isLoading } = useQuery({
    queryKey: ["hoursReport", from, to],
    queryFn: () => dashboardApi.getHoursReport(from, to),
    enabled: !!from && !!to,
  });

  return (
    <>
      <TopBar title="Reports" />
      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              id="from"
              label="From"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              id="to"
              label="To"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dashboardApi.exportCSV(from, to)}
            >
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : report && Array.isArray(report) ? (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium text-right">Total Shifts</th>
                    <th className="px-5 py-3 font-medium text-right">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {(report as Array<{ id: string; name: string; totalShifts: number; totalHours: number }>).map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{row.name}</td>
                      <td className="px-5 py-3 text-right">{row.totalShifts}</td>
                      <td className="px-5 py-3 text-right">{row.totalHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}

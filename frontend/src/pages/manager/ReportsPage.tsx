import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import * as dashboardApi from "../../api/dashboard.api";
import { toDateString, addDays, getMonday } from "../../lib/dateUtils";
import { Download, FileText } from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { usePermissions } from "../../hooks/usePermissions";
import { useLocations } from "../../hooks/useLocations";

export function ReportsPage() {
  const now = new Date();
  const [from, setFrom] = useState(toDateString(addDays(getMonday(now), -28)));
  const [to, setTo] = useState(toDateString(now));
  const [exportingPdf, setExportingPdf] = useState(false);
  // Store managers start on their own store; the owner starts on every store
  const { homeStore } = usePermissions();
  const { data: locations } = useLocations();
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const storeId = storeFilter ?? homeStore?.id ?? "";
  const store = locations?.find((l) => l.id === storeId);

  // Matches the server's limit of a year per report
  const validRange = !!from && !!to && from <= to && new Date(to).getTime() - new Date(from).getTime() <= 366 * 86_400_000;
  const { data: report, isLoading } = useQuery({
    queryKey: ["hoursReport", from, to, storeId],
    queryFn: () => dashboardApi.getHoursReport(from, to, storeId),
    enabled: validRange,
  });
  // Rounded to 2dp after adding, so floating-point sums don't show as 7.250000001
  const sum = (key: "totalShifts" | "rotaHours" | "extraHours" | "totalHours") =>
    Math.round((report ?? []).reduce((s, r) => s + r[key], 0) * 100) / 100;

  return (
    <>
      <TopBar title="Reports" />
      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
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
            {locations && locations.length > 1 && (
              <div className="col-span-2 sm:col-span-1">
                <Select
                  id="reportStore"
                  label="Store"
                  value={storeId}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  options={[{ value: "", label: "All stores" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]}
                />
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              disabled={!validRange}
              onClick={() => dashboardApi.exportCSV(from, to, store).catch(() => toast("Couldn't export the CSV", "error"))}
            >
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button
              size="sm"
              disabled={!validRange}
              loading={exportingPdf}
              onClick={() => {
                setExportingPdf(true);
                dashboardApi
                  .exportPDF(from, to, store)
                  .catch(() => toast("Couldn't create the PDF", "error"))
                  .finally(() => setExportingPdf(false));
              }}
            >
              {!exportingPdf && <FileText className="h-4 w-4 mr-1" />} Export PDF
            </Button>
          </div>
        </Card>

        {!validRange ? (
          <p className="text-sm text-gray-500 px-1">Choose a start date on or before the end date, up to a year apart.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : report ? (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium text-right">Shifts</th>
                    <th className="px-5 py-3 font-medium text-right">Rota Hours</th>
                    <th className="px-5 py-3 font-medium text-right">Extra Hours</th>
                    <th className="px-5 py-3 font-medium text-right">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{row.name}</td>
                      <td className="px-5 py-3 text-right">{row.totalShifts}</td>
                      <td className="px-5 py-3 text-right">{row.rotaHours}h</td>
                      <td className="px-5 py-3 text-right text-amber-600">{row.extraHours ? `+${row.extraHours}h` : "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold">{row.totalHours}h</td>
                    </tr>
                  ))}
                </tbody>
                {report.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-semibold">
                      <td className="px-5 py-3">Total</td>
                      <td className="px-5 py-3 text-right">{sum("totalShifts")}</td>
                      <td className="px-5 py-3 text-right">{sum("rotaHours")}h</td>
                      <td className="px-5 py-3 text-right text-amber-600">{sum("extraHours") ? `+${sum("extraHours")}h` : "—"}</td>
                      <td className="px-5 py-3 text-right">{sum("totalHours")}h</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}

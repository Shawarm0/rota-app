import { Request, RequestHandler } from "express";
import * as dashboardService from "../services/dashboard.service.js";
import * as reportService from "../services/report.service.js";
import { findStore } from "../services/location.service.js";
import { AppError } from "../lib/errors.js";
import { getVisibleStores } from "../middleware/authorize.js";

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.user!.businessId!, await getVisibleStores(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getShiftsToCover: RequestHandler = async (req, res, next) => {
  try {
    const data = await dashboardService.getShiftsToCover(req.user!.businessId!, await getVisibleStores(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getStaffing: RequestHandler = async (req, res, next) => {
  try {
    const weekStart = req.query.weekStart as string;
    const data = await dashboardService.getStaffingOverview(req.user!.businessId!, weekStart, await getVisibleStores(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Validated ?from=YYYY-MM-DD&to=YYYY-MM-DD for reports
function reportRange(req: Request) {
  const from = String(req.query.from ?? "");
  const to = String(req.query.to ?? "");
  const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d).getTime());
  if (!isDate(from) || !isDate(to)) throw new AppError(400, "Choose a valid start and end date");
  if (from > to) throw new AppError(400, "The start date must be on or before the end date");
  return { from, to };
}

// The stores to report on: the visible stores, narrowed to ?storeId when one is chosen
async function storesToReport(req: Request) {
  const visible = await getVisibleStores(req);
  const storeId = req.query.storeId as string | undefined;
  if (!storeId) return visible;
  if (visible) return visible.filter((s) => s.id === storeId);
  const store = await findStore(req.user!.businessId!, storeId);
  return store ? [store] : [];
}

export const getEmployeeSummaries: RequestHandler = async (req, res, next) => {
  try {
    const weekStart = req.query.weekStart as string | undefined;
    const data = await dashboardService.getEmployeeSummaries(
      req.user!.businessId!,
      weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart) ? weekStart : new Date().toISOString().split("T")[0],
      await storesToReport(req),
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getHoursReport: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = reportRange(req);
    const data = await reportService.getHoursReport(req.user!.businessId!, from, to, await storesToReport(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const exportCSV: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = reportRange(req);
    const csv = await reportService.exportCSV(req.user!.businessId!, from, to, await storesToReport(req));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=report-${from}-${to}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

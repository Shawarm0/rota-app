import { RequestHandler } from "express";
import * as dashboardService from "../services/dashboard.service.js";
import * as reportService from "../services/report.service.js";

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.user!.businessId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getStaffing: RequestHandler = async (req, res, next) => {
  try {
    const weekStart = req.query.weekStart as string;
    const data = await dashboardService.getStaffingOverview(req.user!.businessId!, weekStart);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeSummaries: RequestHandler = async (req, res, next) => {
  try {
    const data = await dashboardService.getEmployeeSummaries(req.user!.businessId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getHoursReport: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await reportService.getHoursReport(req.user!.businessId!, from as string, to as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const exportCSV: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const csv = await reportService.exportCSV(req.user!.businessId!, from as string, to as string);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=report-${from}-${to}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

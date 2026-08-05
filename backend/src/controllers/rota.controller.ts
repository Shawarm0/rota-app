import { RequestHandler } from "express";
import * as rotaService from "../services/rota.service.js";
import { param } from "../lib/params.js";

export const createRota: RequestHandler = async (req, res, next) => {
  try {
    const rota = await rotaService.createRota(req.user!.businessId!, req.body);
    res.status(201).json(rota);
  } catch (err) {
    next(err);
  }
};

export const listRotas: RequestHandler = async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const rotas = await rotaService.listRotas(req.user!.businessId!, req.user!.role, status as any);
    res.json(rotas);
  } catch (err) {
    next(err);
  }
};

export const getRota: RequestHandler = async (req, res, next) => {
  try {
    const rota = await rotaService.getRota(param(req, "id"), req.user!.role);
    res.json(rota);
  } catch (err) {
    next(err);
  }
};

export const updateRota: RequestHandler = async (req, res, next) => {
  try {
    const rota = await rotaService.updateRota(param(req, "id"), req.body);
    res.json(rota);
  } catch (err) {
    next(err);
  }
};

export const deleteRota: RequestHandler = async (req, res, next) => {
  try {
    await rotaService.deleteRota(param(req, "id"));
    res.json({ message: "Rota deleted" });
  } catch (err) {
    next(err);
  }
};

export const publishRota: RequestHandler = async (req, res, next) => {
  try {
    const rota = await rotaService.publishRota(param(req, "id"));
    res.json(rota);
  } catch (err) {
    next(err);
  }
};

export const copyRota: RequestHandler = async (req, res, next) => {
  try {
    const rota = await rotaService.copyRota(param(req, "id"), req.body.newStartDate, req.user!.businessId!);
    res.json(rota);
  } catch (err) {
    next(err);
  }
};

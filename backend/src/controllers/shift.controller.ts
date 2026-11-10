import { RequestHandler } from "express";
import * as crossStore from "../services/crossStore.service.js";

// Only show each shift's staff category to people allowed to see it
async function withVisibleCategory<T extends { user?: Parameters<typeof redactCategory>[1] | null }>(req: Request, shift: T): Promise<T> {
  const access = await getAccess(req);
  return shift.user ? { ...shift, user: redactCategory(access, shift.user) } : shift;
}
import * as shiftService from "../services/shift.service.js";
import { param } from "../lib/params.js";
import { writeAuditLog } from "../middleware/auditLog.js";
import { assertCanEditStore, assertUserAtStore, getAccess, redactCategory } from "../middleware/authorize.js";
import type { Request } from "express";
import { assertCanEditRota, assertShiftsAtEditableStores } from "../middleware/rotaAccess.js";

export const createShift: RequestHandler = async (req, res, next) => {
  try {
    const rota = await assertCanEditRota(req, param(req, "rotaId"));
    await assertShiftsAtEditableStores(req, rota.location?.name ?? null, [req.body]);
    const shift = await shiftService.createShift(param(req, "rotaId"), req.body);
    await crossStore.requestApprovalsIfNeeded(req, { id: shift.id });
    res.status(201).json(await withVisibleCategory(req, shift));
  } catch (err) {
    next(err);
  }
};

export const updateShift: RequestHandler = async (req, res, next) => {
  try {
    await assertCanEditStore(req, await shiftService.getShiftStore(param(req, "id"), req.user!.businessId!));
    // Moving a shift to another store counts as changing that store too
    if (req.body.location !== undefined) await assertCanEditStore(req, req.body.location || null);
    if (req.body.userId && req.body.userId !== (await shiftService.getShiftAssigneeId(param(req, "id")))) {
      await assertUserAtStore(req, req.body.userId);
    }
    const before = await shiftService.getShiftSnapshot(param(req, "id"));
    const shift = await shiftService.updateShift(param(req, "id"), req.body);
    await crossStore.requestApprovalsIfNeeded(req, { id: shift.id });
    writeAuditLog({
      userId: req.user!.userId,
      action: "EDIT_SHIFT",
      entity: "Shift",
      entityId: shift.id,
      details: { before, after: await shiftService.getShiftSnapshot(shift.id) },
    });
    res.json(await withVisibleCategory(req, shift));
  } catch (err) {
    next(err);
  }
};

export const deleteShift: RequestHandler = async (req, res, next) => {
  try {
    await assertCanEditStore(req, await shiftService.getShiftStore(param(req, "id"), req.user!.businessId!));
    const shift = await shiftService.getShiftSnapshot(param(req, "id"));
    await shiftService.deleteShift(param(req, "id"));
    writeAuditLog({
      userId: req.user!.userId,
      action: "DELETE_SHIFT",
      entity: "Shift",
      entityId: param(req, "id"),
      details: shift,
    });
    res.json({ message: "Shift deleted" });
  } catch (err) {
    next(err);
  }
};

export const bulkCreateShifts: RequestHandler = async (req, res, next) => {
  try {
    const rota = await assertCanEditRota(req, param(req, "rotaId"));
    await assertShiftsAtEditableStores(req, rota.location?.name ?? null, req.body.shifts);
    const result = await shiftService.bulkCreateShifts(param(req, "rotaId"), req.body.shifts);
    await crossStore.requestApprovalsIfNeeded(req, { rotaId: param(req, "rotaId") });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyShifts: RequestHandler = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const shifts = await shiftService.getShiftsForUser(
      req.user!.userId,
      from as string | undefined,
      to as string | undefined,
    );
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

export const getAllShifts: RequestHandler = async (req, res, next) => {
  try {
    const { from, to, location } = req.query;
    const access = await getAccess(req);
    let stores = access.visibleStores;
    // A store-based assistant manager looks at one store at a time: their own, or one they work at
    if (access.isAssistantManager && access.calendarStores && access.homeStore) {
      stores = [access.calendarStores.find((s) => s.name === location) ?? access.homeStore];
    }
    const shifts = await shiftService.getAllShifts(
      req.user!.businessId!,
      from as string | undefined,
      to as string | undefined,
      location as string | undefined,
      stores,
    );
    res.json(await Promise.all(shifts.map((s) => withVisibleCategory(req, s))));
  } catch (err) {
    next(err);
  }
};

export const getAvailableShifts: RequestHandler = async (req, res, next) => {
  try {
    const shifts = await shiftService.getAvailableShifts(req.user!.businessId!, req.user!.userId);
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

export const requestCover: RequestHandler = async (req, res, next) => {
  try {
    await assertCanEditStore(req, await shiftService.getShiftStore(param(req, "id"), req.user!.businessId!));
    const result = await shiftService.requestCover(param(req, "id"));
    writeAuditLog({
      userId: req.user!.userId,
      action: "REQUEST_COVER",
      entity: "Shift",
      entityId: param(req, "id"),
      details: { ...(await shiftService.getShiftSnapshot(param(req, "id"))), notified: result.notified },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const syncShifts: RequestHandler = async (req, res, next) => {
  try {
    const rota = await assertCanEditRota(req, param(req, "rotaId"));
    await assertShiftsAtEditableStores(req, rota.location?.name ?? null, req.body.shifts);
    // Anyone newly added must work at a store this person runs (home or "also works at"); people already on
    // the rota (e.g. placed there by the owner) can stay
    const current = new Set((await shiftService.getRotaShifts(rota.id)).map((s) => s.userId));
    const added = new Set((req.body.shifts as { userId?: string | null }[]).map((s) => s.userId).filter((id): id is string => !!id && !current.has(id)));
    for (const userId of added) await assertUserAtStore(req, userId);
    await shiftService.syncShifts(param(req, "rotaId"), req.body.shifts);
    await crossStore.requestApprovalsIfNeeded(req, { rotaId: param(req, "rotaId") });
    res.json(await shiftService.getRotaShifts(param(req, "rotaId")));
  } catch (err) {
    next(err);
  }
};

export const createAdditionalShift: RequestHandler = async (req, res, next) => {
  try {
    await assertCanEditStore(req, req.body.location || null);
    if (req.body.userId) await assertUserAtStore(req, req.body.userId);
    // Staff from another store wait for their home manager's approval before they're told about the shift
    const pending = await crossStore.needsApproval(req, req.body.userId, req.body.location || null);
    const shift = await shiftService.createAdditionalShift(req.user!.businessId!, req.body, !pending);
    if (pending) await crossStore.requestApprovalsIfNeeded(req, { id: shift.id });
    // An open shift can be put up for cover straight away
    const cover = !shift.userId && req.body.requestCover ? await shiftService.requestCover(shift.id) : null;
    writeAuditLog({
      userId: req.user!.userId,
      action: "ADD_ADDITIONAL",
      entity: "Shift",
      entityId: shift.id,
      details: {
        assignee: shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : null,
        date: shift.date.toISOString().split("T")[0],
        startTime: shift.startTime,
        endTime: shift.endTime,
        location: shift.location,
      },
    });
    if (cover) {
      writeAuditLog({
        userId: req.user!.userId,
        action: "REQUEST_COVER",
        entity: "Shift",
        entityId: shift.id,
        details: { ...(await shiftService.getShiftSnapshot(shift.id)), notified: cover.notified },
      });
    }
    res.status(201).json(await withVisibleCategory(req, shift));
  } catch (err) {
    next(err);
  }
};

export const claimShift: RequestHandler = async (req, res, next) => {
  try {
    const shift = await shiftService.claimShift(param(req, "id"), req.user!.userId);
    res.json(shift);
  } catch (err) {
    next(err);
  }
};

export const listApprovals: RequestHandler = async (req, res, next) => {
  try {
    res.json(await crossStore.listPendingApprovals(req));
  } catch (err) {
    next(err);
  }
};

const decide = (approve: boolean): RequestHandler => async (req, res, next) => {
  try {
    const result = await crossStore.decideApproval(req, param(req, "id"), approve);
    writeAuditLog({
      userId: req.user!.userId,
      action: approve ? "APPROVE_CROSS_STORE" : "REJECT_CROSS_STORE",
      entity: "Shift",
      entityId: param(req, "id"),
      details: result,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const approveCrossStore = decide(true);
export const rejectCrossStore = decide(false);

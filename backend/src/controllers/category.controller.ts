import { Request, RequestHandler } from "express";
import * as categoryService from "../services/category.service.js";
import { param } from "../lib/params.js";
import { getAccess } from "../middleware/authorize.js";
import { AppError, ForbiddenError } from "../lib/errors.js";

// Stores whose categories this person manages: every store for the owner, their own store for a store manager
async function manageableStoreIds(req: Request) {
  const access = await getAccess(req);
  if (access.role === "OWNER" || access.role === "SYSTEM_ADMIN") return null;
  return access.role === "MANAGER" && access.homeStore ? [access.homeStore.id] : [];
}

async function assertCanManageCategory(req: Request, id: string) {
  const storeId = await categoryService.getCategoryStoreId(id, req.user!.businessId!);
  const stores = await manageableStoreIds(req);
  if (stores && (!storeId || !stores.includes(storeId))) {
    throw new ForbiddenError("You can only manage your own store's categories");
  }
}

export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const stores = await manageableStoreIds(req);
    // Store managers always add to their own store; the owner picks the store
    const locationId = stores ? stores[0] : req.body.locationId;
    if (!locationId) throw new AppError(400, "Choose a store for the category");
    const category = await categoryService.createCategory(req.user!.businessId!, locationId, req.body.name, req.body.color);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    res.json(await categoryService.listCategories(req.user!.businessId!, await manageableStoreIds(req)));
  } catch (err) {
    next(err);
  }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
  try {
    await assertCanManageCategory(req, param(req, "id"));
    res.json(await categoryService.updateCategory(param(req, "id"), req.body));
  } catch (err) {
    next(err);
  }
};

export const deleteCategory: RequestHandler = async (req, res, next) => {
  try {
    await assertCanManageCategory(req, param(req, "id"));
    await categoryService.deleteCategory(param(req, "id"));
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};

import { RequestHandler } from "express";
import * as categoryService from "../services/category.service.js";
import { param } from "../lib/params.js";

export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.user!.businessId!, req.body.name, req.body.color);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    const categories = await categoryService.listCategories(req.user!.businessId!);
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(param(req, "id"), req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory: RequestHandler = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(param(req, "id"));
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};

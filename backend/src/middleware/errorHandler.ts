import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";
import logger from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: { message: "A record with this value already exists", code: "DUPLICATE" },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        error: { message: "Record not found", code: "NOT_FOUND" },
      });
      return;
    }
  }

  logger.error(err, "Unhandled error");
  res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
};

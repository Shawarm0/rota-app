import { RequestHandler } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

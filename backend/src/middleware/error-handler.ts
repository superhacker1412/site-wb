import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { env } from "../config/env";
import { AppError } from "../lib/errors";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const exposeDetails = env.NODE_ENV !== "production";

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(exposeDetails && error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      message: "Validation failed",
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ message: "Resource already exists" });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
}

import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  console.error(`[ErrorHandler] [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

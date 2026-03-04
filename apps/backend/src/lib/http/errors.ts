import { NextResponse } from "next/server";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorResponse(error: ApiError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    },
    { status: error.status }
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error);
  }

  return errorResponse(new ApiError(500, "INTERNAL_ERROR", "Unexpected server error"));
}

export function validationError(details?: Record<string, unknown>) {
  return new ApiError(400, "VALIDATION_ERROR", "Request validation failed", details);
}

export function unauthorizedError() {
  return new ApiError(401, "UNAUTHORIZED", "Authentication required");
}

export function forbiddenError() {
  return new ApiError(403, "FORBIDDEN", "You do not have permission for this operation");
}

export function notFoundError(message = "Resource not found") {
  return new ApiError(404, "NOT_FOUND", message);
}

export function conflictError(message: string, details?: Record<string, unknown>) {
  return new ApiError(409, "CONFLICT", message, details);
}

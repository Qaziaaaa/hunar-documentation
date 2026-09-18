import { ApiError } from "@/lib/api-client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function getApiErrorPayload(error: unknown): Record<string, unknown> | null {
  if (error instanceof ApiError && error.payload && typeof error.payload === "object") {
    return error.payload as Record<string, unknown>;
  }
  return null;
}
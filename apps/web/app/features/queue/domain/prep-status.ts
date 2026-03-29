import { PrepStatus } from "../../../../types";

export type ActivePrepStatus = Exclude<PrepStatus, "SERVED">;
export type NextPrepStatus = "ACCEPTED" | "STARTED" | "READY" | "SERVED";

export const nextPrepStatusMap: Record<ActivePrepStatus, NextPrepStatus> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "STARTED",
  STARTED: "READY",
  READY: "SERVED",
};

export function getPrepActionLabel(status: PrepStatus): string | null {
  switch (status) {
    case "PENDING":
      return "Terima";
    case "ACCEPTED":
      return "Mulai";
    case "STARTED":
      return "Siap";
    case "READY":
      return "Sajikan";
    default:
      return null;
  }
}

export function isActivePrepStatus(status: PrepStatus): status is ActivePrepStatus {
  return status !== "SERVED";
}
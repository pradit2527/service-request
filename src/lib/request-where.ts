// Request filters shared by the request lists and the reports. Pure module (it only builds query objects).

import type { Prisma } from "@prisma/client";
import { CLOSED_STATUSES, REQUEST_STATUSES, type RequestStatus } from "./status";

export const OPEN_STATUSES: RequestStatus[] = REQUEST_STATUSES.filter((s) => !CLOSED_STATUSES.includes(s));

/** Requests whose response or fulfillment deadline has passed while the clock was running. */
export function breachedWhere(now: Date): Prisma.ServiceRequestWhereInput {
  return {
    status: { in: OPEN_STATUSES },
    slaPausedAt: null,
    OR: [{ fulfillmentDueAt: { lt: now } }, { AND: [{ firstResponseAt: null }, { responseDueAt: { lt: now } }] }],
  };
}

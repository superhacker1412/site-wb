import { EntityStatus, Prisma } from "@prisma/client";
import { Request } from "express";

import { writeAuditLog } from "../../lib/audit";

export function statusUpdateData(status: EntityStatus) {
  return {
    status,
    archivedAt: status === EntityStatus.ARCHIVED ? new Date() : null,
  };
}

export async function adminAudit(params: {
  adminId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  req: Request;
}): Promise<void> {
  await writeAuditLog({
    adminId: params.adminId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    beforeJson: params.beforeJson,
    afterJson: params.afterJson,
    req: params.req,
  });
}

export function isRelationConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2014")
  );
}

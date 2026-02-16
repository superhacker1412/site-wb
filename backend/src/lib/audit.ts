import { Request } from "express";

import { prisma } from "./prisma";

type AuditPayload = {
  adminId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  req?: Request;
};

export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminId: payload.adminId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      beforeJson: payload.beforeJson as object | undefined,
      afterJson: payload.afterJson as object | undefined,
      ip: payload.req?.ip || null,
      userAgent: payload.req?.get("user-agent") || null,
    },
  });
}

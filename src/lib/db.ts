import { PrismaClient } from "@prisma/client";

// Una sola conexión compartida (evita abrir muchas al recargar en desarrollo).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

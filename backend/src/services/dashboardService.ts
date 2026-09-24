import prisma from "../config/prisma";

export const getDashboardStats = async (userId?: string) => {
  const where = userId ? { userId } : undefined;
  const [total, sent, scheduled, pending, failed, cancelled] = await Promise.all([
    prisma.email.count({ where }),
    prisma.email.count({ where: { ...where, status: "SENT" } }),
    prisma.email.count({ where: { ...where, status: "SCHEDULED" } }),
    prisma.email.count({ where: { ...where, status: "PENDING" } }),
    prisma.email.count({ where: { ...where, status: "FAILED" } }),
    prisma.email.count({ where: { ...where, status: "CANCELLED" } }),
  ]);

  return {
    total,
    sent,
    scheduled,
    pending,
    failed,
    cancelled,
  };
};

export const getRecentEmails = async (userId?: string) => {
  return prisma.email.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

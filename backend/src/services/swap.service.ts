import prisma from "../lib/db.js";
import { env } from "../config/env.js";
import { AppError, ForbiddenError, NotFoundError, ConflictError } from "../lib/errors.js";

export async function requestSwap(userId: string, shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { rota: true },
  });
  if (!shift) throw new NotFoundError("Shift");
  if (shift.userId !== userId) throw new ForbiddenError("You can only swap your own shifts");
  if (shift.status !== "ASSIGNED") {
    throw new AppError(400, "Only assigned shifts can be swapped");
  }

  const existing = await prisma.swapRequest.findFirst({
    where: { shiftId, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) throw new ConflictError("A swap request already exists for this shift");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, businessId: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const swap = await tx.swapRequest.create({
      data: { shiftId, requesterId: userId },
      include: {
        shift: true,
        requester: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await tx.shift.update({
      where: { id: shiftId },
      data: { status: "ADDITIONAL" },
    });

    const managers = await tx.user.findMany({
      where: { businessId: user!.businessId, role: "MANAGER", active: true },
      select: { id: true },
    });

    if (managers.length > 0) {
      await tx.notification.createMany({
        data: managers.map((m) => ({
          userId: m.id,
          title: "Swap Request",
          body: `${user!.firstName} ${user!.lastName} requested to swap a shift on ${shift.date.toISOString().split("T")[0]}.`,
          data: { type: "SWAP_REQUEST", swapRequestId: swap.id },
        })),
      });
    }

    return swap;
  });

  return result;
}

export async function acceptSwap(swapId: string, acceptorId: string) {
  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: { shift: { include: { rota: true } }, requester: { select: { firstName: true, lastName: true } } },
  });
  if (!swap) throw new NotFoundError("Swap request");
  if (swap.status !== "PENDING") throw new AppError(400, "This swap is no longer available");
  if (swap.requesterId === acceptorId) throw new AppError(400, "You cannot accept your own swap");

  const dateStr = swap.shift.date.toISOString().split("T")[0];

  const conflicts = await prisma.shift.findMany({
    where: {
      userId: acceptorId,
      date: swap.shift.date,
      status: { not: "AVAILABLE" },
    },
  });

  for (const existing of conflicts) {
    if (swap.shift.startTime < existing.endTime && swap.shift.endTime > existing.startTime) {
      throw new ConflictError("You have a conflicting shift on this date");
    }
  }

  if (env.SWAP_APPROVAL_REQUIRED) {
    const updated = await prisma.swapRequest.update({
      where: { id: swapId },
      data: { acceptorId, status: "ACCEPTED" },
      include: {
        shift: true,
        requester: { select: { id: true, firstName: true, lastName: true } },
        acceptor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const managers = await prisma.user.findMany({
      where: { businessId: swap.shift.rota.businessId, role: "MANAGER", active: true },
      select: { id: true },
    });

    if (managers.length > 0) {
      await prisma.notification.createMany({
        data: managers.map((m) => ({
          userId: m.id,
          title: "Swap Accepted - Pending Approval",
          body: `A swap has been accepted and needs your approval for ${dateStr}.`,
          data: { type: "SWAP_ACCEPTED", swapRequestId: swapId },
        })),
      });
    }

    return updated;
  }

  return finalizeSwap(swapId, acceptorId);
}

export async function approveSwap(swapId: string) {
  const swap = await prisma.swapRequest.findUnique({ where: { id: swapId } });
  if (!swap) throw new NotFoundError("Swap request");
  if (swap.status !== "ACCEPTED") throw new AppError(400, "Swap must be accepted first");
  if (!swap.acceptorId) throw new AppError(400, "No acceptor for this swap");

  return finalizeSwap(swapId, swap.acceptorId);
}

async function finalizeSwap(swapId: string, acceptorId: string) {
  return prisma.$transaction(async (tx) => {
    const swap = await tx.swapRequest.update({
      where: { id: swapId },
      data: { acceptorId, status: "APPROVED" },
      include: {
        shift: { include: { rota: true } },
        requester: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await tx.shift.update({
      where: { id: swap.shiftId },
      data: { userId: acceptorId, status: "ADDITIONAL" },
    });

    const acceptor = await tx.user.findUnique({
      where: { id: acceptorId },
      select: { firstName: true, lastName: true },
    });

    const dateStr = swap.shift.date.toISOString().split("T")[0];

    await tx.notification.createMany({
      data: [
        {
          userId: swap.requesterId,
          title: "Swap Completed",
          body: `Your shift on ${dateStr} has been swapped with ${acceptor!.firstName} ${acceptor!.lastName}.`,
          data: { type: "SWAP_COMPLETED", swapRequestId: swapId },
        },
        {
          userId: acceptorId,
          title: "Swap Completed",
          body: `You accepted a swap shift on ${dateStr} from ${swap.requester.firstName} ${swap.requester.lastName}.`,
          data: { type: "SWAP_COMPLETED", swapRequestId: swapId },
        },
      ],
    });

    return swap;
  });
}

export async function rejectSwap(swapId: string) {
  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: { shift: true },
  });
  if (!swap) throw new NotFoundError("Swap request");
  if (swap.status !== "PENDING" && swap.status !== "ACCEPTED") {
    throw new AppError(400, "Cannot reject this swap");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.swapRequest.update({
      where: { id: swapId },
      data: { status: "REJECTED" },
    });

    await tx.shift.update({
      where: { id: swap.shiftId },
      data: { status: "ASSIGNED" },
    });

    await tx.notification.create({
      data: {
        userId: swap.requesterId,
        title: "Swap Rejected",
        body: `Your swap request has been rejected.`,
        data: { type: "SWAP_REJECTED", swapRequestId: swapId },
      },
    });

    return updated;
  });

  return result;
}

export async function cancelSwap(swapId: string, userId: string) {
  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: { shift: true },
  });
  if (!swap) throw new NotFoundError("Swap request");
  if (swap.requesterId !== userId) throw new ForbiddenError("You can only cancel your own swaps");
  if (swap.status !== "PENDING") throw new AppError(400, "Can only cancel pending swaps");

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.swapRequest.update({
      where: { id: swapId },
      data: { status: "CANCELLED" },
    });

    await tx.shift.update({
      where: { id: swap.shiftId },
      data: { status: "ASSIGNED" },
    });

    return updated;
  });

  return result;
}

export async function listSwapRequests(businessId: string, status?: string) {
  return prisma.swapRequest.findMany({
    where: {
      requester: { businessId },
      ...(status ? { status: status as any } : {}),
    },
    include: {
      shift: true,
      requester: { select: { id: true, firstName: true, lastName: true } },
      acceptor: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

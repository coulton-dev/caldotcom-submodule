import { v4 as uuidv4 } from "uuid";

import dayjs from "@calcom/dayjs";
import { sendAcceptBookingForwarding } from "@calcom/emails";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { getTranslation } from "@calcom/lib/server";
import prisma from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/trpc";

import type { TBookingForwardingConfirm, TBookingForwardingInputSchema } from "./bookingForwarding.schema";

type BookingForwardingT = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TBookingForwardingInputSchema;
};

export const bookingForwardingCreate = async ({ ctx, input }: BookingForwardingT) => {
  if (!ctx.user.id) {
    throw new Error("user_not_found");
  }

  if (!input.startDate || !input.endDate) {
    throw new Error("start_date_and_end_date_required");
  }

  // Validate start date is before end date
  if (dayjs(input.startDate).isAfter(dayjs(input.endDate))) {
    throw new Error("start_date_must_be_before_end_date");
  }

  // Validate start and end date are in the future
  if (dayjs(input.startDate).isBefore(dayjs().subtract(1, "d").startOf("day"))) {
    throw new Error("start_date_must_be_in_the_future");
  }

  let toUserId;

  if (input.toTeamUserId) {
    const user = await prisma.user.findUnique({
      where: {
        id: input.toTeamUserId,
      },
      select: {
        id: true,
      },
    });
    toUserId = user?.id;
  }
  if (!toUserId) {
    throw new Error("user_not_found");
  }

  // Validate if already exists
  const bookingForwarding = await prisma.bookingForwarding.findFirst({
    where: {
      start: dayjs(input.startDate).startOf("day").toISOString(),
      end: dayjs(input.endDate).endOf("day").toISOString(),
      userId: ctx.user.id,
      toUserId: toUserId,
    },
  });

  if (bookingForwarding) {
    throw new Error("booking_forwarding_already_exists");
  }

  // Prevent infinite redirects
  const existingBookingForwarding = await prisma.bookingForwarding.findFirst({
    select: {
      userId: true,
      toUserId: true,
      status: true,
    },
    where: {
      userId: toUserId,
      toUserId: ctx.user.id,
    },
  });

  if (existingBookingForwarding) {
    throw new Error("booking_forwarding_infinite_not_allowed");
  }

  // Count number of booking redirects with accepted status and start date in the future
  const acceptedBookingForwardings = await prisma.bookingForwarding.count({
    where: {
      userId: ctx.user.id,
      start: {
        gte: new Date().toISOString(),
      },
    },
  });

  // Limit to 10 always
  if (acceptedBookingForwardings >= 10) {
    throw new Error("booking_redirect_limit_reached");
  }

  const createdForwarding = await prisma.bookingForwarding.create({
    data: {
      uuid: uuidv4(),
      start: dayjs(input.startDate).startOf("day").toISOString(),
      end: dayjs(input.endDate).endOf("day").toISOString(),
      userId: ctx.user.id,
      toUserId: toUserId,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // await send email to notify user
  const userToNotify = await prisma.user.findFirst({
    where: {
      id: toUserId,
    },
    select: {
      email: true,
    },
  });
  const t = await getTranslation(ctx.user.locale ?? "en", "common");
  const formattedStartDate = new Intl.DateTimeFormat("en-US").format(createdForwarding.start);
  const formattedEndDate = new Intl.DateTimeFormat("en-US").format(createdForwarding.end);
  if (userToNotify?.email) {
    await sendAcceptBookingForwarding({
      language: t,
      fromEmail: ctx.user.email,
      toEmail: userToNotify.email,
      toName: ctx.user.username || "",
      acceptLink: `${WEBAPP_URL}/booking-forwarding/accept/${createdForwarding?.uuid}`,
      rejectLink: `${WEBAPP_URL}/booking-forwarding/reject/${createdForwarding?.uuid}`,
      dates: `${formattedStartDate} - ${formattedEndDate}`,
    });
  }
  return {};
};

type BookingForwardingConfirmT = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TBookingForwardingConfirm;
};

export const bookingForwardingAccept = async ({ ctx, input }: BookingForwardingConfirmT) => {
  if (!input.bookingForwardingUid) {
    throw new Error("booking_redirect_id_required");
  }

  // Validate bookingForwarding is targeted to the user accepting it
  const bookingForwarding = await prisma.bookingForwarding.findFirst({
    where: {
      id: Number(input.bookingForwardingUid),
      toUserId: ctx.user.id,
    },
  });

  if (!bookingForwarding) {
    throw new Error("booking_redirect_not_found");
  }

  await prisma.bookingForwarding.update({
    where: {
      id: Number(input.bookingForwardingUid),
    },
    data: {
      status: "PENDING",
      updatedAt: new Date(),
    },
  });

  return {};
};

type BookingForwardingDeleteT = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TBookingForwardingConfirm;
};

export const bookingForwardingDelete = async ({ ctx, input }: BookingForwardingDeleteT) => {
  if (!input.bookingForwardingUid) {
    throw new Error("booking_redirect_id_required");
  }

  // Validate bookingForwarding belongs to the user deleting it
  const bookingForwarding = await prisma.bookingForwarding.findFirst({
    select: {
      uuid: true,
      userId: true,
    },
    where: {
      uuid: input.bookingForwardingUid,
      userId: ctx.user.id,
    },
  });

  if (!bookingForwarding) {
    throw new Error("booking_redirect_not_found");
  }

  await prisma.bookingForwarding.delete({
    where: {
      uuid: input.bookingForwardingUid,
    },
  });

  return {};
};

export const bookingForwardingList = async ({ ctx }: { ctx: { user: NonNullable<TrpcSessionUser> } }) => {
  const bookingForwardings = await prisma.bookingForwarding.findMany({
    where: {
      userId: ctx.user.id,
      end: {
        gte: new Date().toISOString(),
      },
    },
    orderBy: {
      start: "desc",
    },
    select: {
      id: true,
      uuid: true,
      start: true,
      end: true,
      status: true,
      toUserId: true,
      toUser: {
        select: {
          username: true,
        },
      },
    },
  });

  return bookingForwardings;
};

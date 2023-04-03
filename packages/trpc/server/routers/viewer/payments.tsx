import { z } from "zod";

import appStore from "@calcom/app-store";
import dayjs from "@calcom/dayjs";
import { sendNoShowFeeChargedEmail } from "@calcom/emails";
import { getTranslation } from "@calcom/lib/server/i18n";
import type { CalendarEvent } from "@calcom/types/Calendar";

import { TRPCError } from "@trpc/server";

import { router, authedProcedure } from "../../trpc";

export const paymentsRouter = router({
  chargeCard: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("🚀 ~ file: payments.tsx:13 ~ .mutation ~ input:", input);
      const { prisma } = ctx;

      const booking = await prisma.booking.findFirst({
        where: {
          id: input.bookingId,
        },
        include: {
          payment: true,
          user: true,
          attendees: true,
          eventType: true,
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      const tOrganizer = await getTranslation(booking.user?.locale ?? "en", "common");

      const attendeesListPromises = [];

      for (const attendee of booking.attendees) {
        const attendeeObject = {
          name: attendee.name,
          email: attendee.email,
          timeZone: attendee.timeZone,
          language: {
            translate: await getTranslation(attendee.locale ?? "en", "common"),
            locale: attendee.locale ?? "en",
          },
        };

        attendeesListPromises.push(attendeeObject);
      }

      const attendeesList = await Promise.all(attendeesListPromises);

      const evt: CalendarEvent = {
        type: (booking?.eventType?.title as string) || booking?.title,
        title: booking.title,
        startTime: dayjs(booking.startTime).format(),
        endTime: dayjs(booking.endTime).format(),
        organizer: {
          email: booking.user?.email || "",
          name: booking.user?.name || "Nameless",
          timeZone: booking.user?.timeZone || "",
          language: { translate: tOrganizer, locale: booking.user?.locale ?? "en" },
        },
        attendees: attendeesList,
        paymentInfo: {
          amount: booking.payment[0].amount,
          currency: booking.payment[0].currency,
          paymentOption: booking.payment[0].paymentOption,
        },
      };

      const paymentCredential = await prisma.credential.findFirst({
        where: {
          userId: ctx.user.id,
          appId: booking.payment[0].appId,
        },
        include: {
          app: true,
        },
      });

      const paymentApp = appStore[paymentCredential?.app?.dirName as keyof typeof appStore];
      const PaymentService = paymentApp.lib.PaymentService;
      const paymentInstance = new PaymentService(paymentCredential);

      try {
        const paymentData = await paymentInstance.chargeCard(booking.payment[0], booking.id);

        if (!paymentData) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Could not generate payment data` });
        }

        await sendNoShowFeeChargedEmail({ attendee: attendeesListPromises[0], evt });

        return paymentData;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error processing payment with error ${err}`,
        });
      }
    }),
});

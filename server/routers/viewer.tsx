import { BookingStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { checkPremiumUsername } from "@ee/lib/core/checkPremiumUsername";

import { checkRegularUsername } from "@lib/core/checkRegularUsername";
import getIntegrations from "@lib/integrations/getIntegrations";
import slugify from "@lib/slugify";

import { getCalendarAdapterOrNull } from "../../lib/calendarClient";
import { createProtectedRouter } from "../createRouter";
import { resizeBase64Image } from "../lib/resizeBase64Image";

const checkUsername =
  process.env.NEXT_PUBLIC_APP_URL === "https://cal.com" ? checkPremiumUsername : checkRegularUsername;

// routes only available to authenticated users
export const viewerRouter = createProtectedRouter()
  .query("me", {
    resolve({ ctx }) {
      return ctx.user;
    },
  })
  .query("bookings", {
    input: z.object({
      status: z.enum(["upcoming", "past", "cancelled"]),
    }),
    async resolve({ ctx, input }) {
      const { prisma, user } = ctx;
      const bookingListingByStatus = input.status;
      const bookingListingFilters: Record<typeof bookingListingByStatus, Prisma.BookingWhereInput[]> = {
        upcoming: [{ endTime: { gte: new Date() } }],
        past: [{ endTime: { lte: new Date() } }],
        cancelled: [{ status: { equals: BookingStatus.CANCELLED } }],
      };
      const bookingListingOrderby: Record<typeof bookingListingByStatus, Prisma.BookingOrderByInput> = {
        upcoming: { startTime: "desc" },
        past: { startTime: "asc" },
        cancelled: { startTime: "asc" },
      };
      const passedBookingsFilter = bookingListingFilters[bookingListingByStatus];
      const orderBy = bookingListingOrderby[bookingListingByStatus];

      const bookingsQuery = await prisma.booking.findMany({
        where: {
          OR: [
            {
              userId: user.id,
            },
            {
              attendees: {
                some: {
                  email: user.email,
                },
              },
            },
          ],
          AND: passedBookingsFilter,
        },
        select: {
          uid: true,
          title: true,
          description: true,
          attendees: true,
          confirmed: true,
          rejected: true,
          id: true,
          startTime: true,
          endTime: true,
          eventType: {
            select: {
              team: {
                select: {
                  name: true,
                },
              },
            },
          },
          status: true,
        },
        orderBy,
      });

      const bookings = bookingsQuery.reverse().map((booking) => {
        return {
          ...booking,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
        };
      });

      return bookings;
    },
  })
  .query("integrations", {
    async resolve({ ctx }) {
      const { user } = ctx;
      const { credentials } = user;
      const integrations = getIntegrations(credentials);

      function countActive(items: { credential?: unknown }[]) {
        return items.reduce((acc, item) => acc + (item.credential ? 1 : 0), 0);
      }
      async function fetchCalendars() {
        const results = await Promise.allSettled(
          integrations
            .flatMap((item) => (item.variant === "calendar" ? [item] : []))
            .map(async (item) => {
              if (!item.credential) {
                return {
                  ...item,
                  selectable: null,
                };
              }
              const adapter = getCalendarAdapterOrNull({
                ...item.credential,
                userId: user.id,
              });

              const selectable = await adapter.listCalendars();
              const primary = selectable.find((cal) => cal.primary);
              if (!primary) {
                return {
                  ...item,
                  selectable: null,
                };
              }
              return {
                ...item,
                selectable: {
                  primary,
                  items: selectable,
                },
              };
            })
        );
        // FIXME do something with the rejected promises?

        return results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      }
      const conferencing = integrations.flatMap((item) => (item.variant === "conferencing" ? [item] : []));
      const payment = integrations.flatMap((item) => (item.variant === "payment" ? [item] : []));
      const calendar = await fetchCalendars();

      return {
        conferencing: {
          items: conferencing,
          numActive: countActive(conferencing),
        },
        calendar: {
          items: calendar,
          numActive: countActive(calendar),
        },
        payment: {
          items: payment,
          numActive: countActive(payment),
        },
      };
    },
  })
  .mutation("updateProfile", {
    input: z.object({
      username: z.string().optional(),
      name: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      timeZone: z.string().optional(),
      weekStart: z.string().optional(),
      hideBranding: z.boolean().optional(),
      theme: z.string().optional().nullable(),
      completedOnboarding: z.boolean().optional(),
      locale: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
      const { user, prisma } = ctx;
      const data: Prisma.UserUpdateInput = {
        ...input,
      };
      if (input.username) {
        const username = slugify(input.username);
        // Only validate if we're changing usernames
        if (username !== user.username) {
          data.username = username;
          const response = await checkUsername(username);
          if (!response.available) {
            throw new TRPCError({ code: "BAD_REQUEST", message: response.message });
          }
        }
      }
      if (input.avatar) {
        data.avatar = await resizeBase64Image(input.avatar);
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data,
      });
    },
  });

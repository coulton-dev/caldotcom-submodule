import { BookingStatus, Credential, SelectedCalendar } from "@prisma/client";

import { getBusyCalendarTimes } from "@calcom/core/CalendarManager";
import dayjs from "@calcom/dayjs";
import logger from "@calcom/lib/logger";
import { performance } from "@calcom/lib/server/perfObserver";
import prisma from "@calcom/prisma";
import type { EventBusyDetails } from "@calcom/types/Calendar";

export async function getBufferedBusyTimes(params: {
  credentials: Credential[];
  userId: number;
  eventTypeId?: number;
  startTime: string;
  endTime: string;
  selectedCalendars: SelectedCalendar[];
  userBufferTime: number;
  afterEventBuffer?: number;
}): Promise<EventBusyDetails[]> {
  const busy = await getBusyTimes({
    credentials: params.credentials,
    userId: params.userId,
    eventTypeId: params.eventTypeId,
    startTime: params.startTime,
    endTime: params.endTime,
    selectedCalendars: params.selectedCalendars,
  });
  return busy.map((a) => ({
    ...a,
    start: dayjs(a.start).subtract(params.userBufferTime, "minute").toISOString(),
    end: dayjs(a.end)
      .add(params.userBufferTime + (params.afterEventBuffer || 0), "minute")
      .toISOString(),
    title: a.title,
  }));
}

export async function getBusyTimes(params: {
  credentials: Credential[];
  userId: number;
  eventTypeId?: number;
  startTime: string;
  endTime: string;
  selectedCalendars: SelectedCalendar[];
}) {
  const { credentials, userId, eventTypeId, startTime, endTime, selectedCalendars } = params;
  logger.silly(
    `Checking Busy time from Cal Bookings in range ${startTime} to ${endTime} for input ${JSON.stringify({
      userId,
      eventTypeId,
      status: BookingStatus.ACCEPTED,
    })}`
  );
  const startPrismaBookingGet = performance.now();
  const busyTimes: EventBusyDetails[] = await prisma.booking
    .findMany({
      where: {
        userId,
        eventTypeId,
        startTime: { gte: new Date(startTime) },
        endTime: { lte: new Date(endTime) },
        status: {
          in: [BookingStatus.ACCEPTED],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        title: true,
      },
    })
    .then((bookings) =>
      bookings.map(({ startTime, endTime, title, id }) => ({
        end: endTime,
        start: startTime,
        title,
        source: `eventType-${eventTypeId}-booking-${id}`,
      }))
    );
  logger.silly(`Busy Time from Cal Bookings ${JSON.stringify(busyTimes)}`);
  const endPrismaBookingGet = performance.now();
  logger.debug(`prisma booking get took ${endPrismaBookingGet - startPrismaBookingGet}ms`);
  if (credentials?.length > 0) {
    const calendarBusyTimes = await getBusyCalendarTimes(credentials, startTime, endTime, selectedCalendars);

    busyTimes.push(...calendarBusyTimes); /*
    // TODO: Disabled until we can filter Zoom events by date. Also this is adding too much latency.
    const videoBusyTimes = (await getBusyVideoTimes(credentials)).filter(notEmpty);
    console.log("videoBusyTimes", videoBusyTimes);
    busyTimes.push(...videoBusyTimes);
    */
  }
  return busyTimes;
}

export default getBusyTimes;

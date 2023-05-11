import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import type { Availability } from "@calcom/prisma/client";

export type DateRange = {
  start: Dayjs;
  end: Dayjs;
};

export function processWorkingHours({
  item,
  timeZone,
  dateFrom,
  dateTo,
}: {
  item: Availability;
  timeZone: string;
  dateFrom: Dayjs;
  dateTo: Dayjs;
}) {
  const results = [];
  const endDate = dateTo.tz(timeZone);
  for (let date = dateFrom.tz(timeZone); date.isBefore(endDate); date = date.add(1, "day")) {
    if (!item.days.includes(date.day())) {
      continue;
    }
    results.push({
      start: date.hour(item.startTime.getUTCHours()).minute(item.startTime.getUTCMinutes()).second(0),
      end: date.hour(item.endTime.getUTCHours()).minute(item.endTime.getUTCMinutes()).second(0),
    });
  }
  return results;
}

export function processDateOverride({ item, timeZone }: { item: Availability; timeZone: string }) {
  const date = dayjs.tz(item.date, timeZone);
  return {
    start: date.hour(item.startTime.getUTCHours()).minute(item.startTime.getUTCMinutes()).second(0),
    end: date.hour(item.endTime.getUTCHours()).minute(item.endTime.getUTCMinutes()).second(0),
  };
}

export function buildDateRanges({
  availability,
  timeZone /* Organizer timeZone */,
  dateFrom /* Attendee dateFrom */,
  dateTo /* `` dateTo */,
}: {
  timeZone: string;
  availability: Availability[];
  dateFrom: Dayjs;
  dateTo: Dayjs;
}): DateRange[] {
  const groupedWorkingHours = groupByDate(
    availability
      .filter((item) => !!item.days.length)
      .flatMap((item) => processWorkingHours({ item, timeZone, dateFrom, dateTo }))
  );
  const groupedDateOverrides = groupByDate(
    availability.filter((item) => !!item.date).flatMap((item) => processDateOverride({ item, timeZone }))
  );

  return Object.values({
    ...groupedWorkingHours,
    ...groupedDateOverrides,
  }).flat();
}

export function groupByDate(ranges: DateRange[]): { [x: string]: DateRange[] } {
  const results = ranges.reduce(
    (
      previousValue: {
        [date: string]: DateRange[];
      },
      currentValue
    ) => {
      const dateString = currentValue.start.format("YYYY-mm-dd");
      previousValue[dateString] =
        typeof previousValue[dateString] === "undefined"
          ? [currentValue]
          : [...previousValue[dateString], currentValue];
      return previousValue;
    },
    {}
  );

  return results;
}

export function intersect(
  usersAvailability: {
    ranges: DateRange[];
  }[]
): DateRange[] {
  // Get the ranges of the first user
  let commonAvailability = usersAvailability[0].ranges;

  // For each of the remaining users, find the intersection of their ranges with the current common availability
  for (let i = 1; i < usersAvailability.length; i++) {
    const userRanges = usersAvailability[i].ranges;

    const intersectedRanges: {
      start: Dayjs;
      end: Dayjs;
    }[] = [];

    commonAvailability.forEach((commonRange) => {
      userRanges.forEach((userRange) => {
        const intersection = getIntersection(commonRange, userRange);
        if (intersection !== null) {
          // If the current common range intersects with the user range, add the intersected time range to the new array
          intersectedRanges.push(intersection);
        }
      });
    });

    commonAvailability = intersectedRanges;
  }

  // If the common availability is empty, there is no time when all users are available
  if (commonAvailability.length === 0) {
    return [];
  }

  return commonAvailability;
}

function getIntersection(range1: DateRange, range2: DateRange) {
  const start = range1.start.isAfter(range2.start) ? range1.start : range2.start;
  const end = range1.end.isBefore(range2.end) ? range1.end : range2.end;
  if (start.isBefore(end)) {
    return { start, end };
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function subtract(aRanges: DateRange[], bRanges: DateRange[]) {
  return [];
}

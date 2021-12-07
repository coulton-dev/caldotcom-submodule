import { Credential } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import ICAL from "ical.js";
import { createEvent } from "ics";
import {
  createAccount,
  createCalendarObject,
  deleteCalendarObject,
  fetchCalendarObjects,
  fetchCalendars,
  getBasicAuthHeaders,
  updateCalendarObject,
} from "tsdav";
import { v4 as uuidv4 } from "uuid";

import { getLocation, getRichDescription } from "@lib/CalEventParser";
import { symmetricDecrypt } from "@lib/crypto";
import logger from "@lib/logger";

import {
  BaseCalendarApiAdapter,
  CalendarApiAdapter,
  CalendarEvent,
  IntegrationCalendar,
} from "../../calendarClient";

dayjs.extend(utc);

const log = logger.getChildLogger({ prefix: ["[lib] caldav"] });

export class CalDavCalendar extends BaseCalendarApiAdapter implements CalendarApiAdapter {
  private url: string;
  private credentials: Record<string, string>;
  private headers: Record<string, string>;
  private readonly integrationName: string = "caldav_calendar";

  constructor(credential: Credential) {
    super();
    const decryptedCredential = JSON.parse(
      symmetricDecrypt(credential.key as string, process.env.CALENDSO_ENCRYPTION_KEY!)
    );
    const username = decryptedCredential.username;
    const url = decryptedCredential.url;
    const password = decryptedCredential.password;

    this.url = url;

    this.credentials = {
      username,
      password,
    };

    this.headers = getBasicAuthHeaders({
      username,
      password,
    });
  }

  async createEvent(event: CalendarEvent) {
    try {
      const calendars = await this.listCalendars();
      const uid = uuidv4();

      const { error, value: iCalString } = createEvent({
        uid,
        startInputType: "utc",
        start: this.convertDate(event.startTime),
        duration: this.getDuration(event.startTime, event.endTime),
        title: event.title,
        description: getRichDescription(event),
        location: getLocation(event),
        organizer: { email: event.organizer.email, name: event.organizer.name },
        attendees: this.getAttendees(event.attendees),
      });

      if (error) throw new Error("Error creating iCalString");

      if (!iCalString) throw new Error("Error creating iCalString");

      await Promise.all(
        calendars.map((calendar) => {
          return createCalendarObject({
            calendar: {
              url: calendar.externalId,
            },
            filename: `${uid}.ics`,
            iCalString: iCalString,
            headers: this.headers,
          });
        })
      );

      return {
        uid,
        id: uid,
        type: "caldav_calendar",
        password: "",
        url: "",
      };
    } catch (reason) {
      log.error(reason);
      throw reason;
    }
  }

  async updateEvent(uid: string, event: CalendarEvent): Promise<unknown> {
    try {
      const calendars = await this.listCalendars();
      const events = [];

      for (const cal of calendars) {
        const calEvents = await this.getEvents(cal.externalId, null, null);

        for (const ev of calEvents) {
          events.push(ev);
        }
      }

      const { error, value: iCalString } = await createEvent({
        uid,
        startInputType: "utc",
        start: this.convertDate(event.startTime),
        duration: this.getDuration(event.startTime, event.endTime),
        title: event.title,
        description: getRichDescription(event),
        location: getLocation(event),
        organizer: { email: event.organizer.email, name: event.organizer.name },
        attendees: this.getAttendees(event.attendees),
      });

      if (error) {
        log.debug("Error creating iCalString");
        return {};
      }

      const eventsToUpdate = events.filter((event) => event.uid === uid);

      return await Promise.all(
        eventsToUpdate.map((event) => {
          return updateCalendarObject({
            calendarObject: {
              url: event.url,
              data: iCalString,
              etag: event?.etag,
            },
            headers: this.headers,
          });
        })
      );
    } catch (reason) {
      log.error(reason);
      throw reason;
    }
  }

  async deleteEvent(uid: string): Promise<void> {
    try {
      const calendars = await this.listCalendars();
      const events = [];

      for (const cal of calendars) {
        const calEvents = await this.getEvents(cal.externalId, null, null);

        for (const ev of calEvents) {
          events.push(ev);
        }
      }

      const eventsToUpdate = events.filter((event) => event.uid === uid);

      await Promise.all(
        eventsToUpdate.map((event) => {
          return deleteCalendarObject({
            calendarObject: {
              url: event.url,
              etag: event?.etag,
            },
            headers: this.headers,
          });
        })
      );
    } catch (reason) {
      log.error(reason);
      throw reason;
    }
  }

  async getAvailability(dateFrom: string, dateTo: string, selectedCalendars: IntegrationCalendar[]) {
    try {
      const selectedCalendarIds = selectedCalendars
        .filter((e) => e.integration === this.integrationName)
        .map((e) => e.externalId);

      if (selectedCalendarIds.length == 0 && selectedCalendars.length > 0) {
        // Only calendars of other integrations selected
        return Promise.resolve([]);
      }

      return (
        selectedCalendarIds.length === 0
          ? this.listCalendars().then((calendars) => calendars.map((calendar) => calendar.externalId))
          : Promise.resolve(selectedCalendarIds)
      ).then(async (ids: string[]) => {
        if (ids.length === 0) {
          return Promise.resolve([]);
        }

        return (
          await Promise.all(
            ids.map(async (calId) => {
              return (await this.getEvents(calId, dateFrom, dateTo)).map((event) => {
                return {
                  start: event.startDate.toISOString(),
                  end: event.endDate.toISOString(),
                };
              });
            })
          )
        ).flatMap((event) => event);
      });
    } catch (reason) {
      log.error(reason);
      throw reason;
    }
  }

  async listCalendars(): Promise<IntegrationCalendar[]> {
    try {
      const account = await this.getAccount();
      const calendars = await fetchCalendars({
        account,
        headers: this.headers,
      });

      return calendars
        .filter((calendar) => {
          return calendar.components?.includes("VEVENT");
        })
        .map((calendar, index) => ({
          externalId: calendar.url,
          name: calendar.displayName ?? "",
          // FIXME Find a better way to set the primary calendar
          primary: index === 0,
          integration: this.integrationName,
        }));
    } catch (reason) {
      log.error(reason);
      throw reason;
    }
  }

  async getEvents(calId: string, dateFrom: string | null, dateTo: string | null) {
    try {
      const objects = await fetchCalendarObjects({
        calendar: {
          url: calId,
        },
        timeRange:
          dateFrom && dateTo
            ? {
                start: dayjs(dateFrom).utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
                end: dayjs(dateTo).utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
              }
            : undefined,
        headers: this.headers,
      });

      if (!objects || objects?.length === 0) {
        return [];
      }

      const events = objects
        .filter((e) => !!e.data)
        .map((object) => {
          const jcalData = ICAL.parse(object.data);
          const vcalendar = new ICAL.Component(jcalData);
          const vevent = vcalendar.getFirstSubcomponent("vevent");
          const event = new ICAL.Event(vevent);

          const calendarTimezone =
            vcalendar.getFirstSubcomponent("vtimezone")?.getFirstPropertyValue("tzid") || "";

          const startDate = calendarTimezone
            ? dayjs(event.startDate.toJSDate()).tz(calendarTimezone)
            : new Date(event.startDate.toUnixTime() * 1000);
          const endDate = calendarTimezone
            ? dayjs(event.endDate.toJSDate()).tz(calendarTimezone)
            : new Date(event.endDate.toUnixTime() * 1000);

          return {
            uid: event.uid,
            etag: object.etag,
            url: object.url,
            summary: event.summary,
            description: event.description,
            location: event.location,
            sequence: event.sequence,
            startDate,
            endDate,
            duration: {
              weeks: event.duration.weeks,
              days: event.duration.days,
              hours: event.duration.hours,
              minutes: event.duration.minutes,
              seconds: event.duration.seconds,
              isNegative: event.duration.isNegative,
            },
            organizer: event.organizer,
            attendees: event.attendees.map((a) => a.getValues()),
            recurrenceId: event.recurrenceId,
            timezone: calendarTimezone,
          };
        });

      return events;
    } catch (reason) {
      log.error(reason);
      throw reason;
    }
  }

  private async getAccount() {
    const account = await createAccount({
      account: {
        serverUrl: `${this.url}`,
        accountType: "caldav",
        credentials: this.credentials,
      },
      headers: this.headers,
    });

    return account;
  }
}

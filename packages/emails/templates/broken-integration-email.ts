import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";
import { createEvent, DateArray, Person } from "ics";
import { TFunction } from "next-i18next";
import rrule from "rrule";

import { getRichDescription } from "@calcom/lib/CalEventParser";
import type { CalendarEvent } from "@calcom/types/Calendar";

import { renderEmail } from "..";
import BaseEmail from "./_base-email";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(toArray);

export default class BrokenIntegrationEmail extends BaseEmail {
  type: string;
  calEvent: CalendarEvent;
  t: TFunction;

  constructor(calEvent: CalendarEvent, type: string) {
    super();
    this.name = "SEND_BROKEN_INTEGRATION";
    this.calEvent = calEvent;
    this.t = this.calEvent.organizer.language.translate;
    this.type = type;
  }

  protected getiCalEventAsString(): string | undefined {
    // Taking care of recurrence rule
    let recurrenceRule: string | undefined = undefined;
    if (this.calEvent.recurringEvent?.count) {
      // ics appends "RRULE:" already, so removing it from RRule generated string
      recurrenceRule = new rrule(this.calEvent.recurringEvent).toString().replace("RRULE:", "");
    }
    const icsEvent = createEvent({
      start: dayjs(this.calEvent.startTime)
        .utc()
        .toArray()
        .slice(0, 6)
        .map((v, i) => (i === 1 ? v + 1 : v)) as DateArray,
      startInputType: "utc",
      productId: "calendso/ics",
      title: this.t("ics_event_title", {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
      }),
      description: this.getTextBody(),
      duration: { minutes: dayjs(this.calEvent.endTime).diff(dayjs(this.calEvent.startTime), "minute") },
      organizer: { name: this.calEvent.organizer.name, email: this.calEvent.organizer.email },
      ...{ recurrenceRule },
      attendees: this.calEvent.attendees.map((attendee: Person) => ({
        name: attendee.name,
        email: attendee.email,
      })),
      status: "CONFIRMED",
    });
    if (icsEvent.error) {
      throw icsEvent.error;
    }
    return icsEvent.value;
  }

  protected getNodeMailerPayload(): Record<string, unknown> {
    const toAddresses = [this.calEvent.organizer.email];
    if (this.calEvent.team) {
      this.calEvent.team.members.forEach((member) => {
        const memberAttendee = this.calEvent.attendees.find((attendee) => attendee.name === member);
        if (memberAttendee) {
          toAddresses.push(memberAttendee.email);
        }
      });
    }

    return {
      icalEvent: {
        filename: "event.ics",
        content: this.getiCalEventAsString(),
      },
      from: `Cal.com <${this.getMailerOptions().from}>`,
      to: toAddresses.join(","),
      subject: `[Action Required] ${this.t("confirmed_event_type_subject", {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
        date: this.getFormattedDate(),
      })}`,
      html: renderEmail("BrokenIntegrationEmail", {
        calEvent: this.calEvent,
        type: this.type,
      }),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(
    title = "",
    subtitle = "emailed_you_and_any_other_attendees",
    extraInfo = "",
    callToAction = ""
  ): string {
    return `
${this.t(
  title || this.calEvent.recurringEvent?.count ? "new_event_scheduled_recurring" : "new_event_scheduled"
)}
${this.t(subtitle)}
${extraInfo}
${getRichDescription(this.calEvent)}
${callToAction}
`.trim();
  }

  protected getTimezone(): string {
    return this.calEvent.organizer.timeZone;
  }

  protected getOrganizerStart(format: string) {
    return this.getRecipientTime(this.calEvent.startTime, format);
  }

  protected getOrganizerEnd(format: string) {
    return this.getRecipientTime(this.calEvent.endTime, format);
  }

  protected getFormattedDate() {
    return `${this.getOrganizerStart("h:mma")} - ${this.getOrganizerEnd("h:mma")}, ${this.t(
      this.getOrganizerStart("dddd").toLowerCase()
    )}, ${this.t(this.getOrganizerStart("MMMM").toLowerCase())} ${this.getOrganizerStart("D, YYYY")}`;
  }
}

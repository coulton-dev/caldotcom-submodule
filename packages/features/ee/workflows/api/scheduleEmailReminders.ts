/* Schedule any workflow reminder that falls within 72 hours for email */
import type { Prisma } from "@prisma/client";
import client from "@sendgrid/client";
import sgMail from "@sendgrid/mail";
import { createEvent } from "ics";
import type { DateArray } from "ics";
import type { NextApiRequest, NextApiResponse } from "next";
import { RRule } from "rrule";
import { v4 as uuidv4 } from "uuid";

import dayjs from "@calcom/dayjs";
import { getCalEventResponses } from "@calcom/features/bookings/lib/getCalEventResponses";
import { parseRecurringEvent } from "@calcom/lib";
import { defaultHandler } from "@calcom/lib/server";
import { getTimeFormatStringFromUserTimeFormat } from "@calcom/lib/timeFormat";
import prisma from "@calcom/prisma";
import { WorkflowActions, WorkflowMethods, WorkflowTemplates } from "@calcom/prisma/enums";
import { bookingMetadataSchema } from "@calcom/prisma/zod-utils";

import type { VariablesType } from "../lib/reminders/templates/customTemplate";
import customTemplate from "../lib/reminders/templates/customTemplate";
import emailReminderTemplate from "../lib/reminders/templates/emailReminderTemplate";

const sendgridAPIKey = process.env.SENDGRID_API_KEY as string;
const senderEmail = process.env.SENDGRID_EMAIL as string;

sgMail.setApiKey(sendgridAPIKey);

type Booking = Prisma.BookingGetPayload<{
  include: {
    eventType: true;
    user: true;
    attendees: true;
  };
}>;

function getiCalEventAsString(booking: Booking) {
  let recurrenceRule: string | undefined = undefined;
  const recurringEvent = parseRecurringEvent(booking.eventType?.recurringEvent);
  if (recurringEvent?.count) {
    recurrenceRule = new RRule(recurringEvent).toString().replace("RRULE:", "");
  }

  const uid = uuidv4();

  const icsEvent = createEvent({
    uid,
    startInputType: "utc",
    start: dayjs(booking.startTime.toISOString() || "")
      .utc()
      .toArray()
      .slice(0, 6)
      .map((v, i) => (i === 1 ? v + 1 : v)) as DateArray,
    duration: {
      minutes: dayjs(booking.endTime.toISOString() || "").diff(
        dayjs(booking.startTime.toISOString() || ""),
        "minute"
      ),
    },
    title: booking.eventType?.title || "",
    description: booking.description || "",
    location: booking.location || "",
    organizer: {
      email: booking.user?.email || "",
      name: booking.user?.name || "",
    },
    attendees: [
      {
        name: booking.attendees[0].name,
        email: booking.attendees[0].email,
        partstat: "ACCEPTED",
        role: "REQ-PARTICIPANT",
        rsvp: true,
      },
    ],
    method: "REQUEST",
    ...{ recurrenceRule },
    status: "CONFIRMED",
  });

  if (icsEvent.error) {
    throw icsEvent.error;
  }

  return icsEvent.value;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization || req.query.apiKey;
  if (process.env.CRON_API_KEY !== apiKey) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_EMAIL) {
    res.status(405).json({ message: "No SendGrid API key or email" });
    return;
  }

  const sandboxMode = process.env.NEXT_PUBLIC_IS_E2E ? true : false;

  const pageSize = 90;
  let pageNumber = 0;

  //delete batch_ids with already past scheduled date from scheduled_sends
  // add pagination
  while (true) {
    const remindersToDelete = await prisma.workflowReminder.findMany({
      where: {
        method: WorkflowMethods.EMAIL,
        cancelled: true,
        scheduledDate: {
          lte: dayjs().toISOString(),
        },
      },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    if (remindersToDelete.length === 0) {
      break;
    }

    for (const reminder of remindersToDelete) {
      try {
        await client.request({
          url: `/v3/user/scheduled_sends/${reminder.referenceId}`,
          method: "DELETE",
        });
      } catch (error) {
        console.log(`Error deleting batch id from scheduled_sends: ${error}`);
      }
    }
    pageNumber++;
  }

  await prisma.workflowReminder.deleteMany({
    where: {
      method: WorkflowMethods.EMAIL,
      scheduledDate: {
        lte: dayjs().toISOString(),
      },
    },
  });

  //cancel reminders for cancelled/rescheduled bookings that are scheduled within the next hour

  pageNumber = 0;
  while (true) {
    const remindersToCancel = await prisma.workflowReminder.findMany({
      where: {
        cancelled: true,
        scheduled: true, //if it is false then they are already cancelled
        scheduledDate: {
          lte: dayjs().add(1, "hour").toISOString(),
        },
      },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    if (remindersToCancel.length === 0) {
      break;
    }

    for (const reminder of remindersToCancel) {
      try {
        await client.request({
          url: "/v3/user/scheduled_sends",
          method: "POST",
          body: {
            batch_id: reminder.referenceId,
            status: "cancel",
          },
        });

        await prisma.workflowReminder.update({
          where: {
            id: reminder.id,
          },
          data: {
            scheduled: false, // to know which reminder already got cancelled (to avoid error from cancelling the same reminders again)
          },
        });
      } catch (error) {
        console.log(`Error cancelling scheduled Emails: ${error}`);
      }
    }
    pageNumber++;
  }

  pageNumber = 0;

  while (true) {
    //find all unscheduled Email reminders
    const unscheduledReminders = await prisma.workflowReminder.findMany({
      where: {
        method: WorkflowMethods.EMAIL,
        scheduled: false,
        scheduledDate: {
          lte: dayjs().add(72, "hour").toISOString(),
        },
        OR: [{ cancelled: false }, { cancelled: null }],
      },
      skip: pageNumber * pageSize,
      take: pageSize,
      include: {
        workflowStep: true,
        booking: {
          include: {
            eventType: true,
            user: true,
            attendees: true,
          },
        },
      },
    });

    if (!unscheduledReminders.length && pageNumber === 0) {
      res.status(200).json({ message: "No Emails to schedule" });
      return;
    }

    if (unscheduledReminders.length === 0) {
      break;
    }

    for (const reminder of unscheduledReminders) {
      if (!reminder.workflowStep || !reminder.booking) {
        continue;
      }
      try {
        let sendTo;

        switch (reminder.workflowStep.action) {
          case WorkflowActions.EMAIL_HOST:
            sendTo = reminder.booking.user?.email;
            break;
          case WorkflowActions.EMAIL_ATTENDEE:
            sendTo = reminder.booking.attendees[0].email;
            break;
          case WorkflowActions.EMAIL_ADDRESS:
            sendTo = reminder.workflowStep.sendTo;
        }

        const name =
          reminder.workflowStep.action === WorkflowActions.EMAIL_ATTENDEE
            ? reminder.booking.attendees[0].name
            : reminder.booking.user?.name;

        const attendeeName =
          reminder.workflowStep.action === WorkflowActions.EMAIL_ATTENDEE
            ? reminder.booking.user?.name
            : reminder.booking.attendees[0].name;

        const timeZone =
          reminder.workflowStep.action === WorkflowActions.EMAIL_ATTENDEE
            ? reminder.booking.attendees[0].timeZone
            : reminder.booking.user?.timeZone;

        const locale =
          reminder.workflowStep.action === WorkflowActions.EMAIL_ATTENDEE ||
          reminder.workflowStep.action === WorkflowActions.SMS_ATTENDEE
            ? reminder.booking.attendees[0].locale
            : reminder.booking.user?.locale;

        let emailContent = {
          emailSubject: reminder.workflowStep.emailSubject || "",
          emailBody: `<body style="white-space: pre-wrap;">${
            reminder.workflowStep.reminderBody || ""
          }</body>`,
        };

        let emailBodyEmpty = false;

        if (reminder.workflowStep.reminderBody) {
          const { responses } = getCalEventResponses({
            bookingFields: reminder.booking.eventType?.bookingFields ?? null,
            booking: reminder.booking,
          });

          const variables: VariablesType = {
            eventName: reminder.booking.eventType?.title || "",
            organizerName: reminder.booking.user?.name || "",
            attendeeName: reminder.booking.attendees[0].name,
            attendeeEmail: reminder.booking.attendees[0].email,
            eventDate: dayjs(reminder.booking.startTime).tz(timeZone),
            eventEndTime: dayjs(reminder.booking?.endTime).tz(timeZone),
            timeZone: timeZone,
            location: reminder.booking.location || "",
            additionalNotes: reminder.booking.description,
            responses: responses,
            meetingUrl: bookingMetadataSchema.parse(reminder.booking.metadata || {})?.videoCallUrl,
            cancelLink: `/booking/${reminder.booking.uid}?cancel=true`,
            rescheduleLink: `/${reminder.booking.user?.username}/${reminder.booking.eventType?.slug}?rescheduleUid=${reminder.booking.uid}`,
          };
          const emailLocale = locale || "en";
          const emailSubject = customTemplate(
            reminder.workflowStep.emailSubject || "",
            variables,
            emailLocale,
            getTimeFormatStringFromUserTimeFormat(reminder.booking.user?.timeFormat),
            !!reminder.booking.user?.hideBranding
          ).text;
          emailContent.emailSubject = emailSubject;
          emailContent.emailBody = customTemplate(
            reminder.workflowStep.reminderBody || "",
            variables,
            emailLocale,
            getTimeFormatStringFromUserTimeFormat(reminder.booking.user?.timeFormat),
            !!reminder.booking.user?.hideBranding
          ).html;

          emailBodyEmpty =
            customTemplate(
              reminder.workflowStep.reminderBody || "",
              variables,
              emailLocale,
              getTimeFormatStringFromUserTimeFormat(reminder.booking.user?.timeFormat)
            ).text.length === 0;
        } else if (reminder.workflowStep.template === WorkflowTemplates.REMINDER) {
          emailContent = emailReminderTemplate(
            false,
            reminder.workflowStep.action,
            getTimeFormatStringFromUserTimeFormat(reminder.booking.user?.timeFormat),
            reminder.booking.startTime.toISOString() || "",
            reminder.booking.endTime.toISOString() || "",
            reminder.booking.eventType?.title || "",
            timeZone || "",
            attendeeName || "",
            name || "",
            !!reminder.booking.user?.hideBranding
          );
        }

        if (emailContent.emailSubject.length > 0 && !emailBodyEmpty && sendTo) {
          const batchIdResponse = await client.request({
            url: "/v3/mail/batch",
            method: "POST",
          });

          const batchId = batchIdResponse[1].batch_id;

          if (reminder.workflowStep.action !== WorkflowActions.EMAIL_ADDRESS) {
            await sgMail.send({
              to: sendTo,
              from: {
                email: senderEmail,
                name: reminder.workflowStep.sender || "Cal.com",
              },
              subject: emailContent.emailSubject,
              html: emailContent.emailBody,
              batchId: batchId,
              sendAt: dayjs(reminder.scheduledDate).unix(),
              replyTo: reminder.booking.user?.email || senderEmail,
              mailSettings: {
                sandboxMode: {
                  enable: sandboxMode,
                },
              },
              attachments: reminder.workflowStep.includeCalendarEvent
                ? [
                    {
                      content: Buffer.from(getiCalEventAsString(reminder.booking) || "").toString("base64"),
                      filename: "event.ics",
                      type: "text/calendar; method=REQUEST",
                      disposition: "attachment",
                      contentId: uuidv4(),
                    },
                  ]
                : undefined,
            });
          }

          await prisma.workflowReminder.update({
            where: {
              id: reminder.id,
            },
            data: {
              scheduled: true,
              referenceId: batchId,
            },
          });
        }
      } catch (error) {
        console.log(`Error scheduling Email with error ${error}`);
      }
    }
    pageNumber++;
  }
  res.status(200).json({ message: "Emails scheduled" });
}

export default defaultHandler({
  POST: Promise.resolve({ default: handler }),
});

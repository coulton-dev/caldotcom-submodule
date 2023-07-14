import schedule from "node-schedule";

import prisma from "@calcom/prisma";
import { WebhookTriggerEvents } from "@calcom/prisma/enums";

export async function scheduleTrigger(
  booking: { id: number; endTime: Date; scheduledJobs: string[] },
  subscriberUrl: string,
  subscriber: { id: string; appId: string | null }
) {
  try {
    //schedule job to call subscriber url at the end of meeting
    // FIXME: in-process scheduling - job will vanish on server crash / restart
    const job = schedule.scheduleJob(
      `${subscriber.appId}_${subscriber.id}`,
      booking.endTime,
      async function () {
        const body = JSON.stringify({ triggerEvent: WebhookTriggerEvents.MEETING_ENDED, ...booking });
        await fetch(subscriberUrl, {
          method: "POST",
          body,
        });

        //remove scheduled job from bookings once triggered
        const updatedScheduledJobs = booking.scheduledJobs.filter((scheduledJob) => {
          return scheduledJob !== `${subscriber.appId}_${subscriber.id}`;
        });

        await prisma.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            scheduledJobs: updatedScheduledJobs,
          },
        });
      }
    );

    //add scheduled job name to booking
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        scheduledJobs: {
          push: job.name,
        },
      },
    });
  } catch (error) {
    console.error("Error cancelling scheduled jobs", error);
  }
}

export async function cancelScheduledJobs(
  booking: { uid: string; scheduledJobs?: string[] },
  appId?: string | null,
  isReschedule?: boolean
) {
  let scheduledJobs = booking.scheduledJobs || [];
  if (!booking.scheduledJobs) return;

  const promises = booking.scheduledJobs.map(async (scheduledJob) => {
    if (appId) {
      if (scheduledJob.startsWith(appId)) {
        if (schedule.scheduledJobs[scheduledJob]) {
          schedule.scheduledJobs[scheduledJob].cancel();
        }
        scheduledJobs = scheduledJobs?.filter((job) => scheduledJob !== job) || [];
      }
    } else {
      //if no specific appId given, delete all scheduled jobs of booking
      if (schedule.scheduledJobs[scheduledJob]) {
        schedule.scheduledJobs[scheduledJob].cancel();
      }
      scheduledJobs = [];
    }

    if (!isReschedule) {
      await prisma.booking.update({
        where: {
          uid: booking.uid,
        },
        data: {
          scheduledJobs: scheduledJobs,
        },
      });
    }
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Error cancelling scheduled jobs", error);
  }
}

import type { TFunction } from "next-i18next";

import { guessEventLocationType } from "@calcom/app-store/locations";
import type { Prisma } from "@calcom/prisma/client";

export type EventNameObjectType = {
  attendeeName: string;
  eventType: string;
  eventName?: string | null;
  host: string;
  location?: string;
  customInputs?: Prisma.JsonObject;
  t: TFunction;
};

export function getEventName(eventNameObj: EventNameObjectType, forAttendeeView = false) {
  if (!eventNameObj.eventName)
    return eventNameObj.t("event_between_users", {
      eventName: eventNameObj.eventType,
      host: eventNameObj.host,
      attendeeName: eventNameObj.attendeeName,
    });

  let eventName = eventNameObj.eventName;
  let locationString = eventNameObj.location || "";

  if (eventNameObj.eventName.includes("{Location}") || eventNameObj.eventName.includes("{LOCATION}")) {
    const eventLocationType = guessEventLocationType(eventNameObj.location);
    if (eventLocationType) {
      locationString = eventLocationType.label;
    }
    eventName = eventName.replace("{Location}", locationString);
    eventName = eventName.replace("{LOCATION}", locationString);
  }

  let dynamicEventName = eventName
    // Need this for compatibility with older event names
    .replaceAll("{Event type title}", eventNameObj.eventType)
    .replaceAll("{Scheduler}", eventNameObj.attendeeName)
    .replaceAll("{Organiser}", eventNameObj.host)
    .replaceAll("{USER}", eventNameObj.attendeeName)
    .replaceAll("{ATTENDEE}", eventNameObj.attendeeName)
    .replaceAll("{HOST}", eventNameObj.host)
    .replaceAll("{HOST/ATTENDEE}", forAttendeeView ? eventNameObj.host : eventNameObj.attendeeName);

  const customInputvariables = dynamicEventName.match(/\{(.+?)}/g)?.map((variable) => {
    return variable.replace("{", "").replace("}", "");
  });

  customInputvariables?.forEach((variable) => {
    if (eventNameObj.customInputs) {
      Object.keys(eventNameObj.customInputs).forEach((customInput) => {
        if (variable === customInput && eventNameObj.customInputs) {
          dynamicEventName = dynamicEventName.replace(
            `{${variable}}`,
            eventNameObj.customInputs[customInput as keyof typeof eventNameObj.customInputs]
          );
        }
      });
    }
  });

  return dynamicEventName;
}

export const validateCustomEventName = (value: string, message: string, customInputs?: Prisma.JsonObject) => {
  let customInputVariables: string[] = [];
  if (customInputs) {
    customInputVariables = Object.keys(customInputs).map((customInput) => {
      return `{${customInput}}`;
    });
  }
  console.log("customInputVariables: " + JSON.stringify(customInputVariables));
  console.log("customInputs: " + JSON.stringify(customInputs));

  const validVariables = customInputVariables.concat([
    "{Event type title}",
    "{Organiser}",
    "{Scheduler}",
    "{Location}",
  ]);
  const matches = value.match(/\{([^}]+)\}/g);
  if (matches?.length) {
    for (const item of matches) {
      if (!validVariables.includes(item)) {
        return message;
      }
    }
  }

  return true;
};

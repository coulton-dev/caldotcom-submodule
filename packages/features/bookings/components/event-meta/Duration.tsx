import type { TFunction } from "next-i18next";
import { useEffect } from "react";

import { useBookerStore } from "@calcom/features/bookings/Booker/store";
import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Badge } from "@calcom/ui";

import type { PublicEvent } from "../../types";

/** Render X mins as X hours or X hours Y mins instead of in minutes once >= 60 minutes */
const getDurationFormatted = (mins: number, t: TFunction) => {
  const hours = Math.floor(mins / 60);
  mins %= 60;
  // format minutes string
  let minStr = "";
  if (mins > 0) {
    minStr =
      mins === 1
        ? t("minute_one", { count: 1 })
        : t("multiple_duration_timeUnit", { count: mins, unit: "minute" });
  }
  // format hours string
  let hourStr = "";
  if (hours > 0) {
    hourStr =
      hours === 1
        ? t("hour_one", { count: 1 })
        : t("multiple_duration_timeUnit", { count: hours, unit: "hour" });
  }

  if (hourStr && minStr) return `${hourStr} ${minStr}`;
  return hourStr || minStr;
};

export const EventDuration = ({ event }: { event: PublicEvent }) => {
  const { t } = useLocale();
  const [selectedDuration, setSelectedDuration, state] = useBookerStore((state) => [
    state.selectedDuration,
    state.setSelectedDuration,
    state.state,
  ]);

  const isDynamicEvent = "isDynamic" in event && event.isDynamic;

  // Function to extract duration from URL
  const getDurationFromURL = () => {
    const pathParts = router.asPath.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    return isNaN(parseInt(lastPart)) ? null : parseInt(lastPart);
  };

  // Sets initial value of selected duration to the default duration.
  useEffect(() => {
    const urlDuration = getDurationFromURL();
    const defaultDurations = event?.metadata?.multipleDuration || [15, 30, 60];
    const durationToSet = urlDuration && defaultDurations.includes(urlDuration) ? urlDuration : event.length;
    if (!selectedDuration) setSelectedDuration(durationToSet);
  }, [selectedDuration, setSelectedDuration, event.metadata?.multipleDuration, event.length, isDynamicEvent]);

  if (!event?.metadata?.multipleDuration && !isDynamicEvent)
    return <>{getDurationFormatted(event.length, t)}</>;

  const durations = event?.metadata?.multipleDuration || [15, 30, 60];
  const urlDuration = getDurationFromURL();

  return (
    <div className="flex flex-wrap gap-2">
      {durations
        .filter((dur) =>
          urlDuration ? dur === urlDuration : state !== "booking" || dur === selectedDuration
        )
        .map((duration) => (
          <Badge
            variant="gray"
            className={classNames(selectedDuration === duration && "bg-brand-default text-brand")}
            size="md"
            key={duration}
            onClick={() => setSelectedDuration(duration)}>
            {getDurationFormatted(duration, t)}
          </Badge>
        ))}
    </div>
  );
};

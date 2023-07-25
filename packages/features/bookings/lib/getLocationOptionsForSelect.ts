import type { LocationObject } from "@calcom/app-store/locations";
import { locationKeyToString } from "@calcom/app-store/locations";
import { getEventLocationType } from "@calcom/app-store/locations";
import type { useLocale } from "@calcom/lib/hooks/useLocale";
import notEmpty from "@calcom/lib/notEmpty";

export default function getLocationsOptionsForSelect(
  locations: LocationObject[],
  t: ReturnType<typeof useLocale>["t"]
) {
  return locations
    .map((location) => {
      const eventLocation = getEventLocationType(location.type);
      const locationString = locationKeyToString(location);

      if (typeof locationString !== "string" || !eventLocation) {
        // It's possible that location app got uninstalled
        return null;
      }
      const type = eventLocation.type;

      // to prevent escaping of "http" when the link is displayed in the booking page
      const shouldLinkDisplayedPublicly = type === "link" && locationString !== "link_meeting";

      return {
        label: shouldLinkDisplayedPublicly ? locationString : t(locationString),
        value: type,
        inputPlaceholder: t(eventLocation?.attendeeInputPlaceholder || "", {
          interpolation: {
            escapeValue: false,
          },
        }),
      };
    })
    .filter(notEmpty);
}

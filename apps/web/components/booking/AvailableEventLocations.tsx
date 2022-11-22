import { getEventLocationType, locationKeyToString } from "@calcom/app-store/locations";
import { classNames } from "@calcom/lib";
import { Icon } from "@calcom/ui";
import Tooltip from "@calcom/ui/v2/core/Tooltip";

import { Props } from "./pages/AvailabilityPage";

export function AvailableEventLocations({ locations }: { locations: Props["eventType"]["locations"] }) {
  return locations.length ? (
    <div className="dark:text-darkgray-600 mr-6 flex w-full flex-col space-y-2 break-words text-sm text-gray-600">
      {locations.map((location) => {
        const eventLocationType = getEventLocationType(location.type);
        if (!eventLocationType) {
          // It's possible that the location app got uninstalled
          return null;
        }
        return (
          <div key={location.type} className="flex flex-row items-center text-sm font-medium">
            {eventLocationType.iconUrl ? (
              <img
                src={eventLocationType.iconUrl}
                className={classNames(
                  "mr-[10px] ml-[2px] h-4 w-4 opacity-70 dark:opacity-100 ",
                  !eventLocationType.iconUrl?.includes("api") ? "dark:invert" : ""
                )}
                alt={`${eventLocationType.label} icon`}
              />
            ) : (
              <Icon.FiLink className="mr-[10px] ml-[2px] h-4 w-4 opacity-70 dark:opacity-100 " />
            )}
            <Tooltip content={locationKeyToString(location)}>
              <p className="truncate">{locationKeyToString(location)}</p>
            </Tooltip>
          </div>
        );
      })}
    </div>
  ) : (
    <></>
  );
}

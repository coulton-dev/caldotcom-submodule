import { DotsHorizontalIcon } from "@heroicons/react/solid";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Button } from "@calcom/ui/v2";

import { CalendarSwitch } from "./CalendarSwitch";

interface IConnectedCalendarItem {
  name: string;
  logo: string;
  externalId?: string;
  integrationType: string;
  calendars?: {
    primary: true | null;
    isSelected: boolean;
    credentialId: number;
    name?: string | undefined;
    readOnly?: boolean | undefined;
    userId?: number | undefined;
    integration?: string | undefined;
    externalId: string;
  }[];
}

const ConnectedCalendarItem = (prop: IConnectedCalendarItem) => {
  const { name, logo, externalId, calendars, integrationType } = prop;
  const { t } = useLocale();
  return (
    <>
      <div className="flex flex-row items-center p-4">
        <img src={logo} alt={name} className="m-1 h-8 w-8" />
        <div className="mx-4">
          <p className="font-sans text-sm font-bold leading-5">
            {name}{" "}
            <span className="mx-1 rounded-[4px] bg-green-100 py-[2px] px-[6px] font-sans text-xs font-medium text-green-600">
              {t("default")}
            </span>
          </p>
          <div className="fle-row flex">
            <span
              title={externalId}
              className="max-w-44 mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-sm text-gray-500">
              {externalId}{" "}
            </span>
          </div>
        </div>

        <Button
          color="minimal"
          type="button"
          className="ml-auto flex rounded-md border border-gray-200 py-[10x] px-4 font-sans text-sm">
          {t("edit")}
        </Button>
      </div>
      <div className="h-[1px] w-full border-b border-gray-200" />
      <div>
        <ul className="p-4">
          {calendars?.map((calendar, i) => (
            <CalendarSwitch
              key={calendar.externalId}
              externalId={calendar.externalId}
              title={calendar.name || "Nameless Calendar"}
              name={calendar.name || "Nameless Calendar"}
              type={integrationType}
              isChecked={calendar.isSelected}
              isLastItemInList={i === calendars.length - 1}
            />
          ))}
        </ul>
      </div>
    </>
  );
};

export { ConnectedCalendarItem };

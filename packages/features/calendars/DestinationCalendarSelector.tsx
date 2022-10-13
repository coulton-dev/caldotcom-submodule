import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { components } from "react-select";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { DestinationCalendar } from "@calcom/prisma/client";
import { trpc } from "@calcom/trpc/react";
import Select from "@calcom/ui/v2/core/form/Select";

interface Props {
  onChange: (value: { externalId: string; integration: string }) => void;
  isLoading?: boolean;
  hidePlaceholder?: boolean;
  /** The external Id of the connected calendar */
  destinationCalendar?: DestinationCalendar | null;
  value: string | undefined;
  maxWidth?: number;
}

const DestinationCalendarSelector = ({
  onChange,
  isLoading,
  value,
  hidePlaceholder,
  maxWidth,
  destinationCalendar,
}: Props): JSX.Element | null => {
  const { t } = useLocale();
  const query = trpc.useQuery(["viewer.connectedCalendars"]);
  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string } | null>(null);

  // Extra styles to show prefixed text in react-select
  const content = (hidePlaceholder = false) => {
    if (!hidePlaceholder) {
      return {
        alignItems: "center",
        width: "100%",
        display: "flex",
        ":before": {
          content: `'${t("select_destination_calendar")}:'`,
          display: "block",
          marginRight: 8,
        },
      };
    }
    return {};
  };

  const SingleValue = (props) => {
    const { label, subtitle } = props.data;
    return (
      <components.SingleValue {...props}>
        {label} <span className="text-neutral-500">{subtitle}</span>
      </components.SingleValue>
    );
  };

  const Option = (props) => {
    console.log("🚀 ~ file: DestinationCalendarSelector.tsx ~ line 49 ~ SingleValue ~ props", props);
    const { label } = props.data;
    return (
      <components.Option {...props}>
        <span>{label}</span>
      </components.Option>
    );
  };

  // useEffect(() => {
  //   const selected = query.data?.connectedCalendars
  //     .map((connected) => connected.calendars ?? [])
  //     .flat()
  //     .find((cal) => cal.externalId === value);
  //   console.log("🚀 ~ file: DestinationCalendarSelector.tsx ~ line 53 ~ useEffect ~ selected", query.data);

  //   if (selected) {
  //     const selectedIntegration = query.data?.connectedCalendars.find((integration) =>
  //       integration.calendars?.some((calendar) => calendar.externalId === selected.externalId)
  //     );

  //     setSelectedOption({
  //       value: `${selected.integration}:${selected.externalId}`,
  //       label:
  //         `${selected.name} (${selectedIntegration?.integration.title?.replace(/calendar/i, "")} - ${
  //           selectedIntegration?.primary?.name
  //         })` || "",
  //     });
  //   }
  // }, [query.data?.connectedCalendars, value]);

  if (!query.data?.connectedCalendars.length) {
    return null;
  }
  const options =
    query.data.connectedCalendars.map((selectedCalendar) => ({
      key: selectedCalendar.credentialId,
      label: `${selectedCalendar.integration.title?.replace(/calendar/i, "")} (${
        selectedCalendar.primary?.name
      })`,
      options: (selectedCalendar.calendars ?? [])
        .filter((cal) => cal.readOnly === false)
        .map((cal) => ({
          label: ` ${cal.name} `,
          subtitle: `(${selectedCalendar?.integration.title?.replace(/calendar/i, "")} - ${
            selectedCalendar?.primary?.name
          })`,
          value: `${cal.integration}:${cal.externalId}`,
        })),
    })) ?? [];
  return (
    <div className="relative" title={`${t("select_destination_calendar")}: ${selectedOption?.label || ""}`}>
      <Select
        name="primarySelectedCalendar"
        placeholder={
          !hidePlaceholder ? (
            `${t("select_destination_calendar")}`
          ) : (
            <span>
              {t("default_calendar_selected")} ({destinationCalendar?.externalId})
            </span>
          )
        }
        options={options}
        styles={{
          placeholder: (styles) => ({ ...styles, ...content(hidePlaceholder) }),
          singleValue: (styles) => ({ ...styles, ...content(hidePlaceholder) }),
          option: (defaultStyles, state) => ({
            ...defaultStyles,
            backgroundColor: state.isSelected
              ? state.isFocused
                ? "var(--brand-color)"
                : "var(--brand-color)"
              : state.isFocused
              ? "var(--brand-color-dark-mode)"
              : "var(--brand-text-color)",
          }),
          control: (defaultStyles) => {
            return {
              ...defaultStyles,
              "@media only screen and (min-width: 640px)": {
                ...(defaultStyles["@media only screen and (min-width: 640px)"] as object),
                maxWidth,
              },
            };
          },
        }}
        isSearchable={false}
        className={classNames(
          "mt-1 mb-2 block w-full min-w-0 flex-1 rounded-none rounded-r-sm border-gray-300 text-sm"
        )}
        onChange={(option) => {
          setSelectedOption(option);
          if (!option) {
            return;
          }

          /* Split only the first `:`, since Apple uses the full URL as externalId */
          const [integration, externalId] = option.value.split(/:(.+)/);

          onChange({
            integration,
            externalId,
          });
        }}
        isLoading={isLoading}
        value={selectedOption}
        components={{ SingleValue, Option }}
      />
    </div>
  );
};

export default DestinationCalendarSelector;

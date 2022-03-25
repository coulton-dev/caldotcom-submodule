import { PlusIcon, TrashIcon } from "@heroicons/react/outline";
import { DuplicateIcon } from "@heroicons/react/solid";
import dayjs, { Dayjs, ConfigType } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import Button from "@calcom/ui/Button";
import Dropdown, { DropdownMenuTrigger, DropdownMenuContent } from "@calcom/ui/Dropdown";

import { defaultDayRange } from "@lib/availability";
import { weekdayNames } from "@lib/core/i18n/weekday";
import { TimeRange } from "@lib/types/schedule";

import { useMeQuery } from "@components/Shell";
import Select from "@components/ui/form/Select";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Begin Time Increments For Select */
const increment = 15;
/**
 * Creates an array of times on a 15 minute interval from
 * 00:00:00 (Start of day) to
 * 23:45:00 (End of day with enough time for 15 min booking)
 */
const TIMES = (() => {
  const end = dayjs().utc().endOf("day");
  let t: Dayjs = dayjs().utc().startOf("day");

  const times: Dayjs[] = [];
  while (t.isBefore(end)) {
    times.push(t);
    t = t.add(increment, "minutes");
  }
  return times;
})();
/** End Time Increments For Select */

type Option = {
  readonly label: string;
  readonly value: number;
};

type TimeRangeFieldProps = {
  name: string;
};

const TimeRangeField = ({ name }: TimeRangeFieldProps) => {
  // Get user so we can determine 12/24 hour format preferences
  const query = useMeQuery();
  const user = query.data;

  // Lazy-loaded options, otherwise adding a field has a noticable redraw delay.
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<number | undefined>();
  // const { i18n } = useLocale();

  const handleSelected = (value: number | undefined) => {
    setSelected(value);
  };

  const getOption = (time: ConfigType) => ({
    value: dayjs(time).toDate().valueOf(),
    label: dayjs(time)
      .utc()
      .format(user && user.timeFormat === 12 ? "h:mma" : "HH:mm"),
    // .toLocaleTimeString(i18n.language, { minute: "numeric", hour: "numeric" }),
  });

  const timeOptions = useCallback(
    (offsetOrLimitorSelected: { offset?: number; limit?: number; selected?: number } = {}) => {
      const { limit, offset, selected } = offsetOrLimitorSelected;
      return TIMES.filter(
        (time) =>
          (!limit || time.isBefore(limit)) &&
          (!offset || time.isAfter(offset)) &&
          (!selected || time.isAfter(selected))
      ).map((t) => getOption(t));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <Controller
        name={`${name}.start`}
        render={({ field: { onChange, value } }) => {
          handleSelected(value);
          return (
            <Select
              className="w-30"
              options={options}
              onFocus={() => setOptions(timeOptions())}
              onBlur={() => setOptions([])}
              defaultValue={getOption(value)}
              onChange={(option) => {
                onChange(new Date(option?.value as number));
                handleSelected(option?.value);
              }}
            />
          );
        }}
      />
      <span>-</span>
      <Controller
        name={`${name}.end`}
        render={({ field: { onChange, value } }) => (
          <Select
            className="w-30"
            options={options}
            onFocus={() => setOptions(timeOptions({ selected }))}
            onBlur={() => setOptions([])}
            defaultValue={getOption(value)}
            onChange={(option) => onChange(new Date(option?.value as number))}
          />
        )}
      />
    </>
  );
};

type ScheduleBlockProps = {
  day: number;
  weekday: string;
  name: string;
};

const CopyTimes = ({ disabled, onApply }: { disabled: number[]; onApply: (selected: number[]) => void }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const { i18n, t } = useLocale();
  return (
    <div className="m-4 space-y-2 py-4">
      <p className="h6 text-xs font-medium uppercase text-neutral-400">Copy times to</p>
      <ol className="space-y-2">
        {weekdayNames(i18n.language).map((weekday, num) => (
          <li key={weekday}>
            <label className="flex w-full items-center justify-between">
              <span>{weekday}</span>
              <input
                value={num}
                defaultChecked={disabled.includes(num)}
                disabled={disabled.includes(num)}
                onChange={(e) => {
                  if (e.target.checked && !selected.includes(num)) {
                    setSelected(selected.concat([num]));
                  } else if (!e.target.checked && selected.includes(num)) {
                    setSelected(selected.slice(selected.indexOf(num), 1));
                  }
                }}
                type="checkbox"
                className="inline-block rounded-sm border-gray-300 text-neutral-900 focus:ring-neutral-500 disabled:text-neutral-400"
              />
            </label>
          </li>
        ))}
      </ol>
      <div className="pt-2">
        <Button className="w-full justify-center" color="primary" onClick={() => onApply(selected)}>
          {t("apply")}
        </Button>
      </div>
    </div>
  );
};

export const DayRanges = ({
  name,
  defaultValue = [defaultDayRange],
}: {
  name: string;
  defaultValue?: TimeRange[];
}) => {
  const { setValue } = useFormContext();
  const { fields, replace, append, remove } = useFieldArray({
    name,
  });

  useEffect(() => {
    if (defaultValue.length && !fields.length) {
      replace(defaultValue);
    }
  }, [replace, defaultValue, fields.length]);

  const handleAppend = () => {
    // FIXME: Fix type-inference, can't get this to work. @see https://github.com/react-hook-form/react-hook-form/issues/4499
    const nextRangeStart = dayjs((fields[fields.length - 1] as unknown as TimeRange).end);
    const nextRangeEnd = dayjs(nextRangeStart).add(1, "hour");

    if (nextRangeEnd.isBefore(nextRangeStart.endOf("day"))) {
      return append({
        start: nextRangeStart.toDate(),
        end: nextRangeEnd.toDate(),
      });
    }
  };

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id} className="mb-1 flex justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <TimeRangeField name={`${name}.${index}`} />
            <Button
              size="icon"
              color="minimal"
              StartIcon={TrashIcon}
              type="button"
              onClick={() => remove(index)}
            />
          </div>
          {index === 0 && (
            <span>
              <Button
                className="text-neutral-400"
                type="button"
                color="minimal"
                size="icon"
                StartIcon={PlusIcon}
                onClick={handleAppend}
              />
              <Dropdown>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    color="minimal"
                    size="icon"
                    StartIcon={DuplicateIcon}
                    onClick={handleAppend}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <CopyTimes
                    disabled={[parseInt(name.substring(name.lastIndexOf(".") + 1), 10)]}
                    onApply={(selected) =>
                      selected.forEach((day) => {
                        setValue(name.substring(0, name.lastIndexOf(".") + 1) + day, fields);
                      })
                    }
                  />
                </DropdownMenuContent>
              </Dropdown>
            </span>
          )}
        </div>
      ))}
    </>
  );
};

const ScheduleBlock = ({ name, day, weekday }: ScheduleBlockProps) => {
  const { t } = useLocale();

  const form = useFormContext();
  const watchAvailable = form.watch(`${name}.${day}`, []);

  return (
    <fieldset className="flex flex-col justify-between space-y-2 py-5 sm:flex-row sm:space-y-0">
      <div className="w-1/3">
        <label className="flex items-center space-x-2 rtl:space-x-reverse">
          <input
            type="checkbox"
            checked={watchAvailable.length}
            onChange={(e) => {
              form.setValue(`${name}.${day}`, e.target.checked ? [defaultDayRange] : []);
            }}
            className="inline-block rounded-sm border-gray-300 text-neutral-900 focus:ring-neutral-500"
          />
          <span className="inline-block text-sm capitalize">{weekday}</span>
        </label>
      </div>
      <div className="flex-grow">
        {!!watchAvailable.length && <DayRanges name={`${name}.${day}`} defaultValue={[]} />}
        {!watchAvailable.length && (
          <span className="block text-sm text-gray-500">{t("no_availability")}</span>
        )}
      </div>
    </fieldset>
  );
};

const Schedule = ({ name }: { name: string }) => {
  const { i18n } = useLocale();
  return (
    <fieldset className="divide-y divide-gray-200">
      {weekdayNames(i18n.language).map((weekday, num) => (
        <ScheduleBlock key={num} name={name} weekday={weekday} day={num} />
      ))}
    </fieldset>
  );
};

export default Schedule;

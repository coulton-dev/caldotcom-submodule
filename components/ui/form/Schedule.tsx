import { PlusIcon, TrashIcon } from "@heroicons/react/outline";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useState } from "react";
import { Controller, useFieldArray } from "react-hook-form";

import { weekdayNames } from "@lib/core/i18n/weekday";
import { useLocale } from "@lib/hooks/useLocale";
import { TimeRange, Schedule as ScheduleType } from "@lib/types/schedule";

import Button from "@components/ui/Button";
import Select from "@components/ui/form/Select";

/** Begin Time Increments For Select */
const increment = 15;
/**
 * Creates an array of times on a 15 minute interval from
 * 00:00:00 (Start of day) to
 * 23:45:00 (End of day with enough time for 15 min booking)
 */
const TIMES = (() => {
  const end = dayjs().endOf("day");
  let t: Dayjs = dayjs().startOf("day");

  const times = [];
  while (t.isBefore(end)) {
    times.push(t);
    t = t.add(increment, "minutes");
  }
  return times;
})();
/** End Time Increments For Select */

// sets the desired time in current date, needs to be current date for proper DST translation
const defaultDayRange: TimeRange = {
  start: new Date(new Date().setHours(9, 0, 0, 0)),
  end: new Date(new Date().setHours(17, 0, 0, 0)),
};

export const DEFAULT_SCHEDULE: ScheduleType = [
  [],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [],
];

type Option = {
  readonly label: string;
  readonly value: number;
};

type TimeRangeFieldProps = {
  name: string;
};

const TimeRangeField = ({ name }: TimeRangeFieldProps) => {
  // Lazy-loaded options, otherwise adding a field has a noticable redraw delay.
  const [options, setOptions] = useState<Option[]>([]);

  const getOption = (time: Date) => ({
    value: time.valueOf(),
    label: time.toLocaleTimeString("nl-NL", { minute: "numeric", hour: "numeric" }),
  });

  const timeOptions = useCallback((offsetOrLimit: { offset?: number; limit?: number } = {}) => {
    const { limit, offset } = offsetOrLimit;
    return TIMES.filter((time) => (!limit || time.isBefore(limit)) && (!offset || time.isAfter(offset))).map(
      (t) => getOption(t.toDate())
    );
  }, []);

  return (
    <>
      <Controller
        name={`${name}.start`}
        render={({ field: { onChange, value } }) => (
          <Select
            className="w-[6rem]"
            options={options}
            onFocus={() => setOptions(timeOptions())}
            onBlur={() => setOptions([])}
            defaultValue={getOption(value)}
            onChange={(option) => onChange(new Date(option?.value as number))}
          />
        )}
      />
      <span>-</span>
      <Controller
        name={`${name}.end`}
        render={({ field: { onChange, value } }) => (
          <Select
            className="w-[6rem]"
            options={options}
            onFocus={() => setOptions(timeOptions())}
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

const ScheduleBlock = ({ name, day, weekday }: ScheduleBlockProps) => {
  const { t } = useLocale();
  const { fields, append, remove, replace } = useFieldArray({
    name: `${name}.${day}`,
  });

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
    <fieldset className="flex justify-between py-5">
      <div className="w-1/3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={fields.length > 0}
            onChange={(e) => (e.target.checked ? replace([defaultDayRange]) : replace([]))}
            className="inline-block border-gray-300 rounded-sm focus:ring-neutral-500 text-neutral-900"
          />
          <span className="inline-block capitalize">{weekday}</span>
        </label>
      </div>
      <div className="flex-grow">
        {fields.map((field, index) => (
          <div key={field.id} className="flex justify-between">
            <div className="flex items-center space-x-2">
              <TimeRangeField name={`${name}.${day}.${index}`} />
            </div>
            <Button
              size="icon"
              color="minimal"
              StartIcon={TrashIcon}
              type="button"
              onClick={() => remove(index)}
            />
          </div>
        ))}
        {!fields.length && t("no_availability")}
      </div>
      <div>
        <Button
          type="button"
          color="minimal"
          size="icon"
          className={fields.length > 0 ? "visible" : "invisible"}
          StartIcon={PlusIcon}
          onClick={handleAppend}
        />
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

import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";
import PrimitiveDatePicker from "react-date-picker/dist/entry.nostyle";
import { Calendar } from "react-feather";

import classNames from "@calcom/lib/classNames";

type Props = {
  date: Date;
  onDatesChange?: ((date: Date) => void) | undefined;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
};

const DatePicker = ({ minDate, disabled, date, onDatesChange, className }: Props) => {
  return (
    <PrimitiveDatePicker
      className={classNames(
        "focus:ring-primary-500 focus:border-primary-500 rounded-sm border border-gray-300 p-1 pl-2 shadow-sm sm:text-sm",
        className
      )}
      clearIcon={null}
      calendarIcon={<Calendar className="h-5 w-5 text-gray-500" />}
      value={date}
      minDate={minDate}
      disabled={disabled}
      onChange={onDatesChange}
    />
  );
};

export default DatePicker;

import { SchedulerEvent } from "./events";

/**
 * @default "week"
 */
export type View = "month" | "week" | "day";
export type startingDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// These will be on eventHandlers - e.g. do more actions on viewchange if required
export type SchedulerPublicActions = {
  onViewChange?: (view: View) => void;
  onEventClick?: (event: SchedulerEvent) => void;
  onEventContextMenu?: (event: SchedulerEvent) => void;
  onEmptyCellClick?: (date: Date) => void;
  onDateChange?: (startDate: Date, endDate?: Date) => void;
};

// We have private actions here that we want to be avalbile in state but not as component props.
export type SchedulerPrivateActions = {
  initState: (state: SchedulerState & SchedulerPublicActions) => void;
  setView: (view: SchedulerComponentProps["view"]) => void;
  setStartDate: (startDate: SchedulerComponentProps["startDate"]) => void;
  setEndDate: (endDate: SchedulerComponentProps["endDate"]) => void;
  setEvents: (events: SchedulerComponentProps["events"]) => void;
  setStartingDayOfWeek: (startingDayOfWeek: SchedulerComponentProps["startingDayOfWeek"]) => void;
};

export type SchedulerState = {
  view?: View;
  startDate?: Date;
  /** By default we just dynamically create endDate from the viewType */
  endDate?: Date;
  events: SchedulerEvent[];
  loading?: boolean;
  editable?: boolean;
  startingDayOfWeek?: startingDayOfWeek;
};

export type SchedulerComponentProps = SchedulerPublicActions & SchedulerState;

export type SchedulerStoreProps = SchedulerComponentProps & SchedulerPrivateActions;

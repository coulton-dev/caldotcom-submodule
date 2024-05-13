import type { ScheduleLabelsType } from "@calcom/features/schedules/components/Schedule";
import type { ApiErrorResponse, ApiResponse, ScheduleOutput } from "@calcom/platform-types";

import { useClientSchedule } from "../../hooks/useClientSchedule";
import useDeleteSchedule from "../../hooks/useDeleteSchedule";
import { useMe } from "../../hooks/useMe";
import useUpdateSchedule from "../../hooks/useUpdateSchedule";
import { AtomsWrapper } from "../../src/components/atoms-wrapper";
import { useToast } from "../../src/components/ui/use-toast";
import type { Availability } from "../AvailabilitySettings";
import type { CustomClassNames } from "../AvailabilitySettings";
import { AvailabilitySettings } from "../AvailabilitySettings";
import { getApiSchedule } from "../getApiSchedule";
import { transformScheduleForAtom } from "../getAtomSchedule";
import type { AvailabilityFormValues } from "../types";

type PlatformAvailabilitySettingsWrapperProps = {
  id?: string;
  labels?: {
    tooltips: Partial<ScheduleLabelsType>;
  };
  customClassNames?: Partial<CustomClassNames>;
  onUpdateSuccess?: (res: ApiResponse<ScheduleOutput>) => void;
  onUpdateError?: (err: ApiErrorResponse) => void;
  onDeleteSuccess?: (res: ApiResponse) => void;
  onDeleteError?: (err: ApiErrorResponse) => void;
};

export const PlatformAvailabilitySettingsWrapper = ({
  id,
  customClassNames,
  onDeleteError,
  onDeleteSuccess,
  onUpdateError,
  onUpdateSuccess,
}: PlatformAvailabilitySettingsWrapperProps) => {
  const { isLoading, data: schedule } = useClientSchedule(id);
  const { data: me } = useMe();
  const userSchedule = transformScheduleForAtom(me?.data, schedule, 1);
  const { timeFormat } = me?.data || { timeFormat: null };
  const { toast } = useToast();

  const { mutate: deleteSchedule, isPending: isDeletionInProgress } = useDeleteSchedule({
    onSuccess: (res) => {
      onDeleteSuccess?.(res);
      toast({
        description: "Schedule deleted successfully",
      });
    },
    onError: (err) => {
      onDeleteError?.(err);
      toast({
        description: "Could not delete schedule",
      });
    },
  });

  const { mutate: updateSchedule, isPending: isSavingInProgress } = useUpdateSchedule({
    onSuccess: (res) => {
      onUpdateSuccess?.(res);
      toast({
        description: "Schedule updated successfully",
      });
    },
    onError: (err) => {
      onUpdateError?.(err);
      toast({
        description: "Could not update schedule",
      });
    },
  });

  const handleDelete = async (id: number) => {
    await deleteSchedule({ id });
  };

  const handleUpdate = async (id: number, body: AvailabilityFormValues) => {
    const updateBody = getApiSchedule(body);
    await updateSchedule({ id, ...updateBody });
  };

  if (isLoading) return <div className="px-10 py-4 text-xl">Loading...</div>;

  if (!userSchedule) return <div className="px-10 py-4 text-xl">No user schedule present</div>;

  return (
    <AtomsWrapper>
      <AvailabilitySettings
        handleDelete={() => {
          userSchedule.id && handleDelete(userSchedule.id);
        }}
        handleSubmit={async (data) => {
          userSchedule.id && handleUpdate(userSchedule.id, data);
        }}
        weekStart="Sunday"
        timeFormat={timeFormat}
        isLoading={isLoading}
        schedule={{
          name: userSchedule.name,
          id: userSchedule.id,
          isLastSchedule: userSchedule.isLastSchedule,
          isDefault: userSchedule.isDefault,
          workingHours: userSchedule.workingHours,
          dateOverrides: userSchedule.dateOverrides,
          timeZone: userSchedule.timeZone,
          availability: userSchedule.availability,
          schedule:
            userSchedule.schedule.reduce(
              (acc: Availability[], avail: Availability) => [
                ...acc,
                { days: avail.days, startTime: new Date(avail.startTime), endTime: new Date(avail.endTime) },
              ],
              []
            ) || [],
        }}
        isDeleting={isDeletionInProgress}
        isSaving={isSavingInProgress}
        backPath=""
        isPlatform={true}
        customClassNames={customClassNames}
      />
    </AtomsWrapper>
  );
};

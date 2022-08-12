import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  getStaticLinkBasedLocation,
  LocationType,
  getEventLocationType,
  EventLocationType,
  LocationObject,
} from "@calcom/app-store/locations";
import { getMessageForOrganizer } from "@calcom/app-store/locations";
import { getHumanReadableLocationValue } from "@calcom/app-store/locations";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { inferQueryOutput, trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui";
import { Dialog, DialogContent } from "@calcom/ui/Dialog";
import { Icon } from "@calcom/ui/Icon";
import PhoneInput from "@calcom/ui/form/PhoneInputLazy";
import { Form } from "@calcom/ui/form/fields";

import { QueryCell } from "@lib/QueryCell";

import CheckboxField from "@components/ui/form/CheckboxField";
import Select from "@components/ui/form/Select";

type BookingItem = inferQueryOutput<"viewer.bookings">["bookings"][number];

type OptionTypeBase = {
  label: string;
  value: EventLocationType["type"];
  disabled?: boolean;
};

interface ISetLocationDialog {
  saveLocation: (newLocationType: EventLocationType["type"], details: { [key: string]: string }) => void;
  selection?: OptionTypeBase;
  booking?: BookingItem;
  defaultValues?: LocationObject[];
  setShowLocationModal: React.Dispatch<React.SetStateAction<boolean>>;
  isOpenDialog: boolean;
  setSelectedLocation?: (param: OptionTypeBase | undefined) => void;
}

export const EditLocationDialog = (props: ISetLocationDialog) => {
  const {
    saveLocation,
    selection,
    booking,
    setShowLocationModal,
    isOpenDialog,
    defaultValues,
    setSelectedLocation,
  } = props;
  const { t } = useLocale();
  const locationsQuery = trpc.useQuery(["viewer.locationOptions"]);

  useEffect(() => {
    if (selection) {
      locationFormMethods.setValue("locationType", selection?.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  let locationLink = z.string().url().optional();
  const eventLocationType = getEventLocationType(selection?.value);

  if (eventLocationType && !eventLocationType.default && eventLocationType.linkType === "static") {
    locationLink = z.string().regex(new RegExp(eventLocationType.urlRegExp)).optional();
  }

  const eventLocation = getEventLocationType(selection?.value);

  const locationFormSchema = z.object({
    locationType: z.string(),
    phone: z.string(),
    locationAddress: z.string().optional(),
    locationLink,
    displayLocationPublicly: z.boolean().optional(),
    locationPhoneNumber: z
      .string()
      .refine((val) => isValidPhoneNumber(val))
      .optional(),
  });

  const locationFormMethods = useForm({
    mode: "onSubmit",
    resolver: zodResolver(locationFormSchema),
  });

  const selectedLocation = useWatch({
    control: locationFormMethods.control,
    name: "locationType",
  });

  const defaultLocation = defaultValues?.find(
    (location: { type: EventLocationType["type"] }) => location.type === eventLocation?.type
  );

  const LocationInput =
    eventLocation?.organizerInputType === "text"
      ? "input"
      : eventLocation?.organizerInputType === "phone"
      ? PhoneInput
      : null;
  const LocationOptions =
    eventLocation && eventLocation.organizerInputType && LocationInput ? (
      <>
        <div>
          <label htmlFor="locationInput" className="block text-sm font-medium text-gray-700">
            {eventLocation.messageForOrganizer}
          </label>
          <div className="mt-1">
            <LocationInput
              type="text"
              control={locationFormMethods.control}
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              {...locationFormMethods.register(eventLocation.variable!)}
              id="locationInput"
              placeholder={eventLocation.organizerInputPlaceholder || ""}
              required
              className="block w-full rounded-sm border-gray-300 text-sm"
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              defaultValue={defaultLocation && defaultLocation[eventLocation.defaultValueVariable!]}
            />
            {locationFormMethods.formState.errors.locationLink && (
              <p className="mt-1 text-sm text-red-500">Invalid Link</p>
            )}
          </div>
          {!booking && (
            <div className="mt-3">
              <Controller
                name="displayLocationPublicly"
                control={locationFormMethods.control}
                render={() => (
                  <CheckboxField
                    defaultChecked={defaultLocation?.displayLocationPublicly}
                    description={t("display_location_label")}
                    onChange={(e) =>
                      locationFormMethods.setValue("displayLocationPublicly", e.target.checked)
                    }
                    informationIconText={t("display_location_info_badge")}
                  />
                )}
              />
            </div>
          )}
        </div>
      </>
    ) : (
      <p className="text-sm">{getMessageForOrganizer(selectedLocation, t)}</p>
    );

  return (
    <Dialog open={isOpenDialog}>
      <DialogContent asChild>
        <div className="inline-block transform rounded-sm bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          <div className="mb-4 sm:flex sm:items-start">
            <div className="bg-secondary-100 mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10">
              <Icon.FiMapPin className="text-primary-600 h-6 w-6" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                {t("edit_location")}
              </h3>
              {!booking && (
                <p className="text-sm text-gray-400">{t("this_input_will_shown_booking_this_event")}</p>
              )}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left" />
          </div>
          {booking && (
            <>
              <p className="mt-6 mb-2 ml-1 text-sm font-bold text-black">{t("current_location")}:</p>
              <p className="mb-2 ml-1 text-sm text-black">
                {getHumanReadableLocationValue(booking.location, t)}
              </p>
            </>
          )}
          <Form
            form={locationFormMethods}
            handleSubmit={async (values) => {
              const { locationType: newLocation, displayLocationPublicly } = values;

              let details = {};
              if (newLocation === LocationType.InPerson) {
                details = {
                  address: values.locationAddress,
                  displayLocationPublicly,
                };
              }
              const staticLinkBasedLocation = getStaticLinkBasedLocation(newLocation);
              if (newLocation === LocationType.Link || staticLinkBasedLocation) {
                details = { link: values.locationLink, displayLocationPublicly };
              }

              if (newLocation === LocationType.UserPhone) {
                details = { hostPhoneNumber: values.locationPhoneNumber };
              }

              saveLocation(newLocation, details);
              setShowLocationModal(false);
              setSelectedLocation?.(undefined);
              locationFormMethods.unregister([
                "locationType",
                "locationLink",
                "locationAddress",
                "locationPhoneNumber",
              ]);
            }}>
            <QueryCell
              query={locationsQuery}
              success={({ data: locationOptions }) => {
                if (!locationOptions.length) return null;
                return (
                  <Controller
                    name="locationType"
                    control={locationFormMethods.control}
                    render={() => (
                      <Select
                        maxMenuHeight={150}
                        name="location"
                        defaultValue={selection}
                        options={
                          booking
                            ? locationOptions.filter((location) => location.value !== "phone")
                            : locationOptions
                        }
                        isSearchable={false}
                        className="my-4 block w-full min-w-0 flex-1 rounded-sm border border-gray-300 text-sm"
                        onChange={(val) => {
                          if (val) {
                            locationFormMethods.setValue("locationType", val.value);
                            locationFormMethods.unregister([
                              "locationLink",
                              "locationAddress",
                              "locationPhoneNumber",
                            ]);
                            locationFormMethods.clearErrors([
                              "locationLink",
                              "locationPhoneNumber",
                              "locationAddress",
                            ]);
                            setSelectedLocation?.(val);
                          }
                        }}
                      />
                    )}
                  />
                );
              }}
            />
            {selectedLocation && LocationOptions}
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setShowLocationModal(false);
                  setSelectedLocation?.(undefined);
                  locationFormMethods.unregister("locationType");
                }}
                type="button"
                color="secondary">
                {t("cancel")}
              </Button>
              <Button type="submit">{t("update")}</Button>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

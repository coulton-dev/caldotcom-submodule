import crypto from "crypto";
import { GetServerSidePropsContext } from "next";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  BaseSyntheticEvent,
  ComponentProps,
  FormEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import TimezoneSelect, { ITimezone } from "react-timezone-select";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import { setIs24hClockInLocalStorage } from "@calcom/lib/timeFormat";
import prisma from "@calcom/prisma";
import { TRPCClientErrorLike } from "@calcom/trpc/client";
import { trpc } from "@calcom/trpc/react";
import { AppRouter } from "@calcom/trpc/server/routers/_app";
import { Alert } from "@calcom/ui/Alert";
import Badge from "@calcom/ui/Badge";
import Button from "@calcom/ui/Button";
import ConfirmationDialogContent from "@calcom/ui/ConfirmationDialogContent";
import { Dialog, DialogTrigger } from "@calcom/ui/Dialog";
import { Icon } from "@calcom/ui/Icon";
import { UpgradeToProDialog } from "@calcom/ui/UpgradeToProDialog";
import { Form, PasswordField } from "@calcom/ui/form/fields";

import { withQuery } from "@lib/QueryCell";
import { asStringOrNull, asStringOrUndefined } from "@lib/asStringOrNull";
import { ErrorCode, getSession } from "@lib/auth";
import { nameOfDay } from "@lib/core/i18n/weekday";
import { isBrandingHidden } from "@lib/isBrandingHidden";
import { inferSSRProps } from "@lib/types/inferSSRProps";

import SettingsShell from "@components/SettingsShell";
import TwoFactor from "@components/auth/TwoFactor";
import InfoBadge from "@components/ui/InfoBadge";
import { UsernameAvailability } from "@components/ui/UsernameAvailability";
import Select from "@components/ui/form/Select";

type Props = inferSSRProps<typeof getServerSideProps>;

function HideBrandingInput(props: { hideBrandingRef: RefObject<HTMLInputElement>; user: Props["user"] }) {
  const { user } = props;
  const { t } = useLocale();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <input
        id="hide-branding"
        name="hide-branding"
        type="checkbox"
        ref={props.hideBrandingRef}
        defaultChecked={isBrandingHidden(user)}
        className="h-4 w-4 rounded-sm border-gray-300 text-neutral-900 focus:ring-neutral-800 disabled:opacity-50"
        onClick={(e) => {
          if (!e.currentTarget.checked || user.plan !== "FREE") {
            return;
          }

          // prevent checking the input
          e.preventDefault();

          setModalOpen(true);
        }}
      />
      <UpgradeToProDialog modalOpen={modalOpen} setModalOpen={setModalOpen}>
        {t("remove_cal_branding_description")}
      </UpgradeToProDialog>
    </>
  );
}
interface DeleteAccountValues {
  totpCode: string;
}

function SettingsView(props: ComponentProps<typeof Settings> & { localeProp: string }) {
  const { user } = props;
  const form = useForm<DeleteAccountValues>();

  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useContext();
  const onSuccessMutation = async () => {
    showToast(t("your_user_profile_updated_successfully"), "success");
    setHasErrors(false); // dismiss any open errors
    await utils.invalidateQueries(["viewer.me"]);
  };

  const onErrorMutation = (error: TRPCClientErrorLike<AppRouter>) => {
    setHasErrors(true);
    setErrorMessage(error.message);
    document?.getElementsByTagName("main")[0]?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const mutation = trpc.useMutation("viewer.updateProfile", {
    onSuccess: onSuccessMutation,
    onError: onErrorMutation,
    async onSettled() {
      await utils.invalidateQueries(["viewer.public.i18n"]);
    },
  });

  const onDeleteMeSuccessMutation = async () => {
    await utils.invalidateQueries(["viewer.me"]);
    showToast(t("Your account was deleted"), "success");

    setHasDeleteErrors(false); // dismiss any open errors
    if (process.env.NEXT_PUBLIC_WEBAPP_URL === "https://app.cal.com") {
      signOut({ callbackUrl: "/auth/logout?survey=true" });
    } else {
      signOut({ callbackUrl: "/auth/logout" });
    }
  };

  const onDeleteMeErrorMutation = (error: TRPCClientErrorLike<AppRouter>) => {
    setHasDeleteErrors(true);
    setDeleteErrorMessage(errorMessages[error.message]);
  };
  const deleteMeMutation = trpc.useMutation("viewer.deleteMe", {
    onSuccess: onDeleteMeSuccessMutation,
    onError: onDeleteMeErrorMutation,
    async onSettled() {
      await utils.invalidateQueries(["viewer.me"]);
    },
  });

  const localeOptions = useMemo(() => {
    return (router.locales || []).map((locale) => ({
      value: locale,
      label: new Intl.DisplayNames(props.localeProp, { type: "language" }).of(locale) || "",
    }));
  }, [props.localeProp, router.locales]);

  const timeFormatOptions = [
    { value: 12, label: t("12_hour") },
    { value: 24, label: t("24_hour") },
  ];
  const usernameRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);
  const hideBrandingRef = useRef<HTMLInputElement>(null!);
  const allowDynamicGroupBookingRef = useRef<HTMLInputElement>(null!);
  const [selectedTimeFormat, setSelectedTimeFormat] = useState({
    value: user.timeFormat || 12,
    label: timeFormatOptions.find((option) => option.value === user.timeFormat)?.label || 12,
  });
  const [selectedTimeZone, setSelectedTimeZone] = useState<ITimezone>(user.timeZone);
  const [selectedWeekStartDay, setSelectedWeekStartDay] = useState({
    value: user.weekStart,
    label: nameOfDay(props.localeProp, user.weekStart === "Sunday" ? 0 : 1),
  });

  const [selectedLanguage, setSelectedLanguage] = useState({
    value: props.localeProp || "",
    label: localeOptions.find((option) => option.value === props.localeProp)?.label || "",
  });
  const [hasErrors, setHasErrors] = useState(false);
  const [hasDeleteErrors, setHasDeleteErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const errorMessages: { [key: string]: string } = {
    [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    [ErrorCode.IncorrectPassword]: `${t("incorrect_password")} ${t("please_try_again")}`,
    [ErrorCode.UserNotFound]: t("no_account_exists"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [brandColor, setBrandColor] = useState(user.brandColor);
  const [darkBrandColor, setDarkBrandColor] = useState(user.darkBrandColor);

  const onConfirmButton = (e: FormEvent) => {
    e.preventDefault();
    const totpCode = form.getValues("totpCode");
    const password = passwordRef.current.value;
    deleteMeMutation.mutate({ password, totpCode });
  };
  const onConfirm = ({ totpCode }: DeleteAccountValues, e: BaseSyntheticEvent | undefined) => {
    e?.preventDefault();
    const password = passwordRef.current.value;
    deleteMeMutation.mutate({ password, totpCode });
  };
  async function updateProfileHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const enteredUsername = usernameRef.current.value.toLowerCase();
    const enteredBrandColor = brandColor;
    const enteredDarkBrandColor = darkBrandColor;
    const enteredTimeZone = typeof selectedTimeZone === "string" ? selectedTimeZone : selectedTimeZone.value;
    const enteredWeekStartDay = selectedWeekStartDay.value;
    const enteredHideBranding = hideBrandingRef.current.checked;
    const enteredAllowDynamicGroupBooking = allowDynamicGroupBookingRef.current.checked;
    const enteredLanguage = selectedLanguage.value;
    const enteredTimeFormat = selectedTimeFormat.value;

    // Write time format to localStorage if available
    // Embed isn't applicable to profile pages. So ignore the rule
    // eslint-disable-next-line @calcom/eslint/avoid-web-storage
    setIs24hClockInLocalStorage(selectedTimeFormat.value === 24);

    // TODO: Add validation

    mutation.mutate({
      username: enteredUsername,
      timeZone: enteredTimeZone,
      weekStart: asStringOrUndefined(enteredWeekStartDay),
      hideBranding: enteredHideBranding,
      allowDynamicBooking: enteredAllowDynamicGroupBooking,
      locale: enteredLanguage,
      timeFormat: enteredTimeFormat,
    });
  }
  const [currentUsername, setCurrentUsername] = useState(user.username || undefined);
  const [inputUsernameValue, setInputUsernameValue] = useState(currentUsername);

  return (
    <>
      <div className="pt-6 pb-4 lg:pb-8">
        <div className="block rtl:space-x-reverse sm:flex sm:space-x-2">
          <div className="w-full">
            <UsernameAvailability
              currentUsername={currentUsername}
              setCurrentUsername={setCurrentUsername}
              inputUsernameValue={inputUsernameValue}
              usernameRef={usernameRef}
              setInputUsernameValue={setInputUsernameValue}
              onSuccessMutation={onSuccessMutation}
              onErrorMutation={onErrorMutation}
              user={user}
            />
          </div>
        </div>
      </div>
      <form className="divide-y divide-gray-200 lg:col-span-9" onSubmit={updateProfileHandler}>
        {hasErrors && <Alert severity="error" title={errorMessage} />}
        <div className="pb-6 lg:pb-8">
          <div className="flex flex-col lg:flex-row">
            <div className="flex-grow space-y-6">
              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                  {t("about")}
                </label>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  {t("language")}
                </label>
                <div className="mt-1">
                  <Select
                    id="languageSelect"
                    value={selectedLanguage || props.localeProp}
                    onChange={(v) => v && setSelectedLanguage(v)}
                    className="mt-1 block w-full rounded-sm text-sm  capitalize"
                    options={localeOptions}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700">
                  {t("timezone")}
                </label>
                <div className="mt-1">
                  <TimezoneSelect
                    id="timeZone"
                    value={selectedTimeZone}
                    onChange={(v) => v && setSelectedTimeZone(v)}
                    className="mt-1 block w-full rounded-sm text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700">
                  {t("time_format")}
                </label>
                <div className="mt-1">
                  <Select
                    id="timeFormatSelect"
                    value={selectedTimeFormat || user.timeFormat}
                    onChange={(v) => v && setSelectedTimeFormat(v)}
                    className="mt-1 block w-full rounded-sm  text-sm  capitalize"
                    options={timeFormatOptions}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="weekStart" className="block text-sm font-medium text-gray-700">
                  {t("first_day_of_week")}
                </label>
                <div className="mt-1">
                  <Select
                    id="weekStart"
                    value={selectedWeekStartDay}
                    onChange={(v) => v && setSelectedWeekStartDay(v)}
                    className="mt-1 block w-full rounded-sm text-sm capitalize"
                    options={[
                      { value: "Sunday", label: nameOfDay(props.localeProp, 0) },
                      { value: "Monday", label: nameOfDay(props.localeProp, 1) },
                      { value: "Tuesday", label: nameOfDay(props.localeProp, 2) },
                      { value: "Wednesday", label: nameOfDay(props.localeProp, 3) },
                      { value: "Thursday", label: nameOfDay(props.localeProp, 4) },
                      { value: "Friday", label: nameOfDay(props.localeProp, 5) },
                      { value: "Saturday", label: nameOfDay(props.localeProp, 6) },
                    ]}
                  />
                </div>
              </div>
              <div className="relative mt-8 flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="dynamic-group-booking"
                    name="dynamic-group-booking"
                    type="checkbox"
                    ref={allowDynamicGroupBookingRef}
                    defaultChecked={props.user.allowDynamicBooking || false}
                    className="h-4 w-4 rounded-sm border-gray-300 text-neutral-900 "
                  />
                </div>
                <div className="text-sm ltr:ml-3 rtl:mr-3">
                  <label
                    htmlFor="dynamic-group-booking"
                    className="flex items-center font-medium text-gray-700">
                    {t("allow_dynamic_booking")} <InfoBadge content={t("allow_dynamic_booking_tooltip")} />
                  </label>
                </div>
              </div>
              <div>
                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <HideBrandingInput user={user} hideBrandingRef={hideBrandingRef} />
                  </div>
                  <div className="text-sm ltr:ml-3 rtl:mr-3">
                    <label htmlFor="hide-branding" className="font-medium text-gray-700">
                      {t("disable_cal_branding")}{" "}
                      {user.plan !== "PRO" && <Badge variant="default">TEAM</Badge>}
                    </label>
                    <p className="text-gray-500">{t("disable_cal_branding_description")}</p>
                  </div>
                </div>
              </div>
              <h3 className="text-md mt-7 font-bold leading-6 text-red-700">{t("danger_zone")}</h3>
              <div>
                <div className="relative flex items-start">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        color="warn"
                        StartIcon={Icon.FiTrash}
                        className="border-2 border-red-700 text-red-700"
                        data-testid="delete-account">
                        {t("delete_account")}
                      </Button>
                    </DialogTrigger>
                    <ConfirmationDialogContent
                      variety="danger"
                      title={t("delete_account")}
                      confirmBtn={
                        <Button color="warn" data-testid="delete-account-confirm">
                          {t("confirm_delete_account")}
                        </Button>
                      }
                      onConfirm={onConfirmButton}>
                      <p className="mb-7">{t("delete_account_confirmation_message")}</p>
                      <PasswordField
                        data-testid="password"
                        name="password"
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        label="Password"
                        ref={passwordRef}
                      />

                      {user.twoFactorEnabled && (
                        <Form handleSubmit={onConfirm} className="pb-4" form={form}>
                          <TwoFactor center={false} />
                        </Form>
                      )}

                      {hasDeleteErrors && <Alert severity="error" title={deleteErrorMessage} />}
                    </ConfirmationDialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
          <hr className="mt-8" />
          <div className="flex justify-end py-4">
            <Button type="submit">{t("save")}</Button>
          </div>
        </div>
      </form>
    </>
  );
}

/**
 * i18n should never be clubbed with other queries, so that it's caching can be managed independently.
 * We intend to not cache i18n query
 **/
const WithQuery = withQuery(["viewer.public.i18n"], { trpc: { context: { skipBatch: true } } });

export default function Settings(props: Props) {
  const { t } = useLocale();

  return (
    <SettingsShell heading={t("profile")} subtitle={t("edit_profile_info_description")}>
      <WithQuery success={({ data }) => <SettingsView {...props} localeProp={data.locale} />} />
    </SettingsShell>
  );
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context);

  if (!session?.user?.id) {
    return { redirect: { permanent: false, destination: "/auth/login" } };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      bio: true,
      avatar: true,
      timeZone: true,
      weekStart: true,
      hideBranding: true,
      theme: true,
      plan: true,
      brandColor: true,
      darkBrandColor: true,
      metadata: true,
      twoFactorEnabled: true,
      timeFormat: true,
      allowDynamicBooking: true,
    },
  });

  if (!user) {
    throw new Error("User seems logged in but cannot be found in the db");
  }

  return {
    props: {
      user: {
        ...user,
        emailMd5: crypto.createHash("md5").update(user.email).digest("hex"),
      },
    },
  };
};

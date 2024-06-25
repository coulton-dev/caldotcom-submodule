import { zodResolver } from "@hookform/resolvers/zod";
import type { EventType } from "@prisma/client";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useOrgBranding } from "@calcom/features/ee/organizations/context/provider";
import { TeamEventTypeForm } from "@calcom/features/ee/teams/components/TeamEventTypeForm";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useTypedQuery } from "@calcom/lib/hooks/useTypedQuery";
import { HttpError } from "@calcom/lib/http-error";
import { md } from "@calcom/lib/markdownIt";
import slugify from "@calcom/lib/slugify";
import turndown from "@calcom/lib/turndownService";
import { MembershipRole, SchedulingType } from "@calcom/prisma/enums";
import { unlockedManagedEventTypeProps } from "@calcom/prisma/zod-utils";
import { createEventTypeInput } from "@calcom/prisma/zod/custom/eventtype";
import { trpc } from "@calcom/trpc/react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  Editor,
  Form,
  showToast,
  TextField,
  Tooltip,
} from "@calcom/ui";

// this describes the uniform data needed to create a new event type on Profile or Team
export interface EventTypeParent {
  teamId: number | null | undefined; // if undefined, then it's a profile
  membershipRole?: MembershipRole | null;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
}

const locationFormSchema = z.array(
  z.object({
    locationType: z.string(),
    locationAddress: z.string().optional(),
    displayLocationPublicly: z.boolean().optional(),
    locationPhoneNumber: z
      .string()
      .refine((val) => isValidPhoneNumber(val))
      .optional(),
    locationLink: z.string().url().optional(), // URL validates as new URL() - which requires HTTPS:// In the input field
  })
);

const querySchema = z.object({
  eventPage: z.string().optional(),
  teamId: z.union([z.string().transform((val) => +val), z.number()]).optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  length: z.union([z.string().transform((val) => +val), z.number()]).optional(),
  description: z.string().optional(),
  schedulingType: z.nativeEnum(SchedulingType).optional(),
  locations: z
    .string()
    .transform((jsonString) => locationFormSchema.parse(JSON.parse(jsonString)))
    .optional(),
});

export default function CreateEventTypeDialog({
  profileOptions,
  isOrganization,
}: {
  profileOptions: {
    teamId: number | null | undefined;
    label: string | null;
    image: string | undefined;
    membershipRole: MembershipRole | null | undefined;
  }[];
  isOrganization: boolean;
}) {
  const utils = trpc.useUtils();
  const { t } = useLocale();
  const router = useRouter();
  const [firstRender, setFirstRender] = useState(true);
  const orgBranding = useOrgBranding();

  const {
    data: { teamId, eventPage: pageSlug },
  } = useTypedQuery(querySchema);

  const teamProfile = profileOptions.find((profile) => profile.teamId === teamId);
  const form = useForm<z.infer<typeof createEventTypeInput>>({
    defaultValues: {
      length: 15,
    },
    resolver: zodResolver(createEventTypeInput),
  });

  const schedulingTypeWatch = form.watch("schedulingType");
  const isManagedEventType = schedulingTypeWatch === SchedulingType.MANAGED;

  useEffect(() => {
    if (isManagedEventType) {
      form.setValue("metadata.managedEventConfig.unlockedFields", unlockedManagedEventTypeProps);
    } else {
      form.setValue("metadata", null);
    }
  }, [schedulingTypeWatch]);

  const { register } = form;

  const isAdmin =
    teamId !== undefined &&
    (teamProfile?.membershipRole === MembershipRole.OWNER ||
      teamProfile?.membershipRole === MembershipRole.ADMIN);

  const createMutation = trpc.viewer.eventTypes.create.useMutation({
    onSuccess: async ({ eventType }) => {
      await utils.viewer.eventTypes.getByViewer.invalidate();
      await router.replace(`/event-types/${eventType.id}${teamId ? "?tabName=team" : ""}`);
      showToast(
        t("event_type_created_successfully", {
          eventTypeTitle: eventType.title,
        }),
        "success"
      );
      form.reset();
    },
    onError: (err) => {
      if (err instanceof HttpError) {
        const message = `${err.statusCode}: ${err.message}`;
        showToast(message, "error");
      }

      if (err.data?.code === "BAD_REQUEST") {
        const message = `${err.data.code}: ${t("error_event_type_url_duplicate")}`;
        showToast(message, "error");
      }

      if (err.data?.code === "UNAUTHORIZED") {
        const message = `${err.data.code}: ${t("error_event_type_unauthorized_create")}`;
        showToast(message, "error");
      }
    },
  });

  const submitButton = (isPending: boolean) => {
    return (
      <DialogFooter showDivider>
        <DialogClose />
        <Button type="submit" loading={isPending}>
          {t("continue")}
        </Button>
      </DialogFooter>
    );
  };

  const handleSuccessMutation = (eventType: EventType) => {
    utils.viewer.eventTypes.getByViewer.invalidate();
    router.replace(`/event-types/${eventType.id}${teamId ? "?tabName=team" : ""}`);
    showToast(
      t("event_type_created_successfully", {
        eventTypeTitle: eventType.title,
      }),
      "success"
    );
  };

  const urlPrefix = orgBranding?.fullDomain ?? process.env.NEXT_PUBLIC_WEBSITE_URL;

  return (
    <Dialog
      name="new"
      clearQueryParamsOnClose={[
        "eventPage",
        "teamId",
        "type",
        "description",
        "title",
        "length",
        "slug",
        "locations",
      ]}>
      <DialogContent
        type="creation"
        enableOverflow
        title={teamId ? t("add_new_team_event_type") : t("add_new_event_type")}
        description={t("new_event_type_to_book_description")}>
        {!teamId ? (
          <Form
            form={form}
            handleSubmit={(values) => {
              createMutation.mutate(values);
            }}>
            <div className="mt-3 space-y-6 pb-11">
              <TextField
                label={t("title")}
                placeholder={t("quick_chat")}
                data-testid="event-type-quick-chat"
                {...register("title")}
                onChange={(e) => {
                  form.setValue("title", e?.target.value);
                  if (form.formState.touchedFields["slug"] === undefined) {
                    form.setValue("slug", slugify(e?.target.value));
                  }
                }}
              />

              {urlPrefix && urlPrefix.length >= 21 ? (
                <div>
                  <TextField
                    label={`${t("url")}: ${urlPrefix}`}
                    required
                    addOnLeading={
                      <Tooltip content={!isManagedEventType ? pageSlug : t("username_placeholder")}>
                        <span className="max-w-24 md:max-w-56">
                          /{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                        </span>
                      </Tooltip>
                    }
                    {...register("slug")}
                    onChange={(e) => {
                      form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
                    }}
                  />

                  {isManagedEventType && (
                    <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
                  )}
                </div>
              ) : (
                <div>
                  <TextField
                    label={t("url")}
                    required
                    addOnLeading={
                      <Tooltip
                        content={`${urlPrefix}/${
                          !isManagedEventType ? pageSlug : t("username_placeholder")
                        }/`}>
                        <span className="max-w-24 md:max-w-56">
                          {urlPrefix}/{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                        </span>
                      </Tooltip>
                    }
                    {...register("slug")}
                  />
                  {isManagedEventType && (
                    <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
                  )}
                </div>
              )}
              <>
                <Editor
                  getText={() => md.render(form.getValues("description") || "")}
                  setText={(value: string) => form.setValue("description", turndown(value))}
                  excludedToolbarItems={["blockType", "link"]}
                  placeholder={t("quick_video_meeting")}
                  firstRender={firstRender}
                  setFirstRender={setFirstRender}
                />

                <div className="relative">
                  <TextField
                    type="number"
                    required
                    min="10"
                    placeholder="15"
                    label={t("duration")}
                    className="pr-4"
                    {...register("length", { valueAsNumber: true })}
                    addOnSuffix={t("minutes")}
                  />
                </div>
              </>
            </div>
            {submitButton(createMutation.isPending)}
          </Form>
        ) : (
          <TeamEventTypeForm
            isAdmin={isAdmin}
            teamId={teamId}
            submitButton={submitButton}
            handleSuccessMutation={handleSuccessMutation}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

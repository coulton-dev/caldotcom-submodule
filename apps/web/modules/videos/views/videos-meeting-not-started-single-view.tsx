"use client";

import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { detectBrowserTimeFormat } from "@calcom/lib/timeFormat";
import { Button, HeadSeo, EmptyScreen } from "@calcom/ui";
import { ArrowRight, Calendar, Clock } from "@calcom/ui/components/icon";

import PageWrapper from "@components/PageWrapper";

import { type PageProps } from "./videos-meeting-not-started-single-view.getServerSideProps";

export default function MeetingNotStarted(props: PageProps) {
  const { t } = useLocale();
  return (
    <>
      <HeadSeo title={t("this_meeting_has_not_started_yet")} description={props.booking.title} />
      <main className="mx-auto my-24 max-w-3xl">
        <EmptyScreen
          Icon={Clock}
          headline={t("this_meeting_has_not_started_yet")}
          description={
            <>
              <h2 className="mb-2 text-center font-medium">{props.booking.title}</h2>
              <p className="text-subtle text-center">
                <Calendar className="-mt-1 mr-1 inline-block h-4 w-4" />
                {dayjs(props.booking.startTime).format(`${detectBrowserTimeFormat}, dddd DD MMMM YYYY`)}
              </p>
            </>
          }
          buttonRaw={
            <Button data-testid="return-home" href="/event-types" EndIcon={ArrowRight}>
              {t("go_back")}
            </Button>
          }
        />
      </main>
    </>
  );
}

MeetingNotStarted.PageWrapper = PageWrapper;

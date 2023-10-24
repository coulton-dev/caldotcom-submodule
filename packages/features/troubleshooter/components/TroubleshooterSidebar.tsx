import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Skeleton } from "@calcom/ui";

import { EventTypeSelect } from "./EventTypeSelect";

const BackButtonInSidebar = ({ name }: { name: string }) => {
  return (
    <Link
      href="/"
      className="hover:bg-subtle group-hover:text-default text-emphasis group flex h-6 max-h-6 w-full flex-row items-center rounded-md px-3 py-2">
      <ArrowLeft className="h-4 w-4 stroke-[2px] ltr:mr-[10px] rtl:ml-[10px] rtl:rotate-180 md:mt-0" />
      <Skeleton
        title={name}
        as="p"
        className="max-w-36 min-h-4 truncate text-xl font-semibold"
        loadingClassName="ms-3">
        {name}
      </Skeleton>
    </Link>
  );
};

export const TroubleshooterSidebar = () => {
  const { i18n, t } = useLocale();

  return (
    <div className="relative z-10 flex w-full flex-col gap-6 py-6 pr-6">
      <BackButtonInSidebar name={t("troubleshooter")} />
      <EventTypeSelect />
    </div>
  );
};

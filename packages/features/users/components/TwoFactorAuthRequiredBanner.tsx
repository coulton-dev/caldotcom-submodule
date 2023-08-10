import { APP_NAME } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import useMeQuery from "@calcom/trpc/react/hooks/useMeQuery";
import { TopBanner } from "@calcom/ui";
import { Key } from "@calcom/ui/components/icon";

function TwoFactorAuthRequiredBanner() {
  const { t } = useLocale();
  const query = useMeQuery();
  const user = query.data;

  const requiresMFA = user && user?.organizationId && !user.twoFactorEnabled;

  if (!requiresMFA) return null;

  return (
    <>
      <TopBanner Icon={Key} text={t("two_factor_auth_required", { appName: APP_NAME })} variant="warning" />
    </>
  );
}

export default TwoFactorAuthRequiredBanner;

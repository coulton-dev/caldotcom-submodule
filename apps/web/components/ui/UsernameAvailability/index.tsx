import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { getOrgFullDomain } from "@calcom/features/ee/organizations/lib/orgDomains";
import { IS_SELF_HOSTED } from "@calcom/lib/constants";
import type { TRPCClientErrorLike } from "@calcom/trpc/client";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc } from "@calcom/trpc/react";
import type { AppRouter } from "@calcom/trpc/server/routers/_app";

import useRouterQuery from "@lib/hooks/useRouterQuery";

import { PremiumTextfield } from "./PremiumTextfield";
import { UsernameTextfield } from "./UsernameTextfield";

interface UsernameAvailabilityFieldProps {
  onSuccessMutation?: () => void;
  onErrorMutation?: (error: TRPCClientErrorLike<AppRouter>) => void;
}

function useUserNamePrefix(organization: RouterOutputs["viewer"]["me"]["organization"]): string {
  return organization
    ? organization.slug
      ? getOrgFullDomain(organization.slug, { protocol: false })
      : organization.metadata && organization.metadata.requestedSlug
      ? getOrgFullDomain(organization.metadata.requestedSlug, { protocol: false })
      : process.env.NEXT_PUBLIC_WEBSITE_URL.replace("https://", "").replace("http://", "")
    : process.env.NEXT_PUBLIC_WEBSITE_URL.replace("https://", "").replace("http://", "");
}

export const UsernameAvailabilityField = ({
  onSuccessMutation,
  onErrorMutation,
}: UsernameAvailabilityFieldProps) => {
  const searchParams = useSearchParams();
  const [user] = trpc.viewer.me.useSuspenseQuery();
  const [currentUsernameState, setCurrentUsernameState] = useState(user.username || "");
  const { username: usernameFromQuery, setQuery: setUsernameFromQuery } = useRouterQuery("username");
  const { username: currentUsername, setQuery: setCurrentUsername } =
    searchParams?.get("username") && user.username === null
      ? { username: usernameFromQuery, setQuery: setUsernameFromQuery }
      : { username: currentUsernameState || "", setQuery: setCurrentUsernameState };
  const formMethods = useForm({
    defaultValues: {
      username: currentUsername,
    },
  });

  const usernamePrefix = useUserNamePrefix(user.organization);
  const UsernameAvailability = IS_SELF_HOSTED || user.organization ? UsernameTextfield : PremiumTextfield;

  return (
    <Controller
      control={formMethods.control}
      name="username"
      render={({ field: { ref, onChange, value } }) => {
        return (
          <UsernameAvailability
            currentUsername={currentUsername}
            setCurrentUsername={setCurrentUsername}
            inputUsernameValue={value}
            usernameRef={ref}
            setInputUsernameValue={onChange}
            onSuccessMutation={onSuccessMutation}
            onErrorMutation={onErrorMutation}
            addOnLeading={usernamePrefix}
          />
        );
      }}
    />
  );
};

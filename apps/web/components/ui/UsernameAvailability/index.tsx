import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { IS_SELF_HOSTED } from "@calcom/lib/constants";
import { User } from "@calcom/prisma/client";
import { TRPCClientErrorLike } from "@calcom/trpc/client";
import { AppRouter } from "@calcom/trpc/server/routers/_app";

import { PremiumTextfield } from "./PremiumTextfield";
import { UsernameTextfield } from "./UsernameTextfield";

export const UsernameAvailability = IS_SELF_HOSTED ? UsernameTextfield : PremiumTextfield;

interface UsernameAvailabilityFieldProps {
  onSuccessMutation?: () => void;
  onErrorMutation?: (error: TRPCClientErrorLike<AppRouter>) => void;
  user: Pick<
    User,
    | "username"
    | "name"
    | "email"
    | "bio"
    | "avatar"
    | "timeZone"
    | "weekStart"
    | "hideBranding"
    | "theme"
    | "plan"
    | "brandColor"
    | "darkBrandColor"
    | "timeFormat"
    | "metadata"
  >;
}
export const UsernameAvailabilityField = ({
  onSuccessMutation,
  onErrorMutation,
  user,
}: UsernameAvailabilityFieldProps) => {
  const [currentUsername, setCurrentUsername] = useState(user.username ?? "");
  const formMethods = useForm({
    defaultValues: {
      username: currentUsername,
    },
  });

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
            user={user}
          />
        );
      }}
    />
  );
};

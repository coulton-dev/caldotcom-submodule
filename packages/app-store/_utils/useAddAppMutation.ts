import { useMutation } from "react-query";

import type { IntegrationOAuthCallbackState } from "@calcom/app-store/types";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { App } from "@calcom/types/App";

function useAddAppMutation(type: App["type"], options?: Parameters<typeof useMutation>[2]) {
  const appName = type.replace(/_/g, "");
  const mutation = useMutation(async () => {
    const state: IntegrationOAuthCallbackState = {
      returnTo: WEBAPP_URL + "/apps/installed" + location.search,
    };
    const stateStr = encodeURIComponent(JSON.stringify(state));
    const searchParams = `?state=${stateStr}`;

    const res = await fetch(`/api/integrations/${appName}/add` + searchParams);

    if (!res.ok) {
      throw new Error("Something went wrong");
    }
    window.location.href = WEBAPP_URL + "/apps/" + type;
  }, options);

  return mutation;
}

export default useAddAppMutation;

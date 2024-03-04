import { assert } from "ts-essentials";

import type { CalSdk } from "../../cal";
import { Endpoints } from "../../lib/endpoints";
import type { BasicPlatformResponse } from "../../types";
import { EndpointHandler } from "../endpoint-handler";
import type { ExchangeCodeParams, ExchangeCodeResponse } from "./types";

export class OAuthFlow extends EndpointHandler {
  constructor(private readonly sdk: CalSdk) {
    super("oauth", sdk);
  }

  async exchange(params: ExchangeCodeParams): Promise<ExchangeCodeResponse> {
    assert(
      this.sdk._internalSecrets().getClientSecret(),
      "Client Secret must be present for OAuthFlow#exchange"
    );

    const { data } = await this.sdk.httpCaller.post<BasicPlatformResponse<ExchangeCodeResponse>>(
      Endpoints.EXCHANGE_OAUTH_AUTH_TOKEN,
      {
        urlParams: [this.sdk.clientId],
        body: {
          clientSecret: this.sdk._internalSecrets().getClientSecret(),
        },
        config: {
          headers: {
            Authorization: `Bearer ${params.authorizationCode}`,
          },
        },
      }
    );

    return data;
  }
}

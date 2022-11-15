import logger from "@calcom/lib/logger";

export type SendgridFieldOptions = [string, string][];

type SendgridUsernameResult = {
  username: string;
  user_id: number;
};

export type SendgridCustomField = {
  id: string;
  name: string;
  field_type: string;
  _metadata: {
    self: string;
  };
};

export type SendgridContact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type SendgridSearchResult = {
  result: SendgridContact[];
};

export type SendgridFieldDefinitions = {
  custom_fields: SendgridCustomField[];
};

export type SendgridNewContact = {
  job_id: string;
};

const environmentApiKey = process.env.SENDGRID_SYNC_API_KEY || "";

/**
 * This class to instance communicating to Sendgrid APIs requires an API Key.
 *
 * You can either pass to the constructor an API Key or have one defined as an
 * environment variable in case the communication to Sendgrid is just for
 * one account only, not configurable by any user at any moment.
 */
export default class Sendgrid {
  private log: typeof logger;
  private apiKey: string;
  private apiUrl: string;

  constructor(providedApiKey = "") {
    this.log = logger.getChildLogger({ prefix: [`[lib] sendgrid`] });
    if (!providedApiKey && !environmentApiKey) throw Error("Sendgrid Api Key not present");
    this.apiKey = providedApiKey || environmentApiKey;
    this.apiUrl = "https://api.sendgrid.com";
  }

  public username = async () => {
    const username = await this.sendgridRequest<SendgridUsernameResult>({
      url: `/v3/user/username`,
      method: "GET",
    });
    return username;
  };

  public async sendgridRequest<R>(requestData: { url: string; method: string; body?: unknown }): Promise<R> {
    this.log.debug("sendgridRequest:request", requestData);
    const results = await fetch(`${this.apiUrl}${requestData.url}`, {
      method: requestData.method,
      headers: new Headers({
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      }),
      ...(requestData.body ? { body: JSON.stringify(requestData.body) } : {}),
    })
      .then(async (res) => {
        const jsonRes = await res.json();
        if (jsonRes.errors) {
          throw Error(`Sendgrid request error: ${jsonRes.errors[0]}`);
        }
        return jsonRes;
      })
      .catch((error) => {
        throw Error(`Sendgrid request error: ${error}`);
      });
    this.log.debug("sendgridRequest:results", results);
    return results;
  }

  public async getSendgridContactId(email: string) {
    const search = await this.sendgridRequest<SendgridSearchResult>({
      url: `/v3/marketing/contacts/search`,
      method: "POST",
      body: {
        query: `email LIKE '${email}'`,
      },
    });
    this.log.debug("sync:sendgrid:getSendgridContactId:search", search);
    return search.result || [];
  }

  public async getSendgridCustomFieldsIds(customFields: SendgridFieldOptions) {
    // Get Custom Activity Fields
    const allFields = await this.sendgridRequest<SendgridFieldDefinitions>({
      url: `/v3/marketing/field_definitions`,
      method: "GET",
    });
    allFields.custom_fields = allFields.custom_fields ?? [];
    this.log.debug("sync:sendgrid:getCustomFieldsIds:allFields", allFields);
    const customFieldsNames = allFields.custom_fields.map((fie) => fie.name);
    this.log.debug("sync:sendgrid:getCustomFieldsIds:customFieldsNames", customFieldsNames);
    const customFieldsExist = customFields.map((cusFie) => customFieldsNames.includes(cusFie[0]));
    this.log.debug("sync:sendgrid:getCustomFieldsIds:customFieldsExist", customFieldsExist);
    return await Promise.all(
      customFieldsExist.map(async (exist, idx) => {
        if (!exist) {
          const [name, field_type] = customFields[idx];
          const created = await this.sendgridRequest<SendgridCustomField>({
            url: `/v3/marketing/field_definitions`,
            method: "POST",
            body: {
              name,
              field_type,
            },
          });
          this.log.debug("sync:sendgrid:getCustomFieldsIds:customField:created", created);
          return created.id;
        } else {
          const index = customFieldsNames.findIndex((val) => val === customFields[idx][0]);
          if (index >= 0) {
            this.log.debug(
              "sync:sendgrid:getCustomFieldsIds:customField:existed",
              allFields.custom_fields[index].id
            );
            return allFields.custom_fields[index].id;
          } else {
            throw Error("Couldn't find the field index");
          }
        }
      })
    );
  }
}

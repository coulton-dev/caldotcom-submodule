import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { fetcher } from "@calcom/app-store/dailyvideo/lib/VideoApiAdapter";
import { getSession } from "@calcom/lib/auth";
import { defaultHandler, defaultResponder } from "@calcom/lib/server";

const getAccessLinkSchema = z.union([
  z.object({
    download_link: z.string(),
    expires: z.number(),
  }),
  z.object({}),
]);

const requestQuery = z.object({
  recordingId: z.string(),
});

const checkIfEmptyObject = (obj: z.infer<typeof getAccessLinkSchema>) =>
  Object.keys(obj).length === 0 && obj.constructor === Object;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<z.infer<typeof getAccessLinkSchema> | void>
) {
  const { recordingId } = requestQuery.parse(req.query);
  const session = await getSession({ req });

  //   Check if user belong to active team
  if (!session?.user?.belongsToActiveTeam) {
    return res.status(403);
  }
  try {
    const response = await fetcher(`/recordings/${recordingId}/access-link`).then(getAccessLinkSchema.parse);

    // !response?.download_link was giving type error
    if (checkIfEmptyObject(response)) {
      return res.status(400);
    }

    return res.status(200).json(response);
  } catch (err) {
    res.status(500);
  }
}

export default defaultHandler({
  GET: Promise.resolve({ default: defaultResponder(handler) }),
});

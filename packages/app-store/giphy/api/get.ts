import type { NextApiRequest, NextApiResponse } from "next";
import { z, ZodError } from "zod";

import prisma from "@calcom/prisma";

import { GiphyManager } from "../lib";

const giphyUrlRegexp = /^https:\/\/media.giphy.com\/media\/(.*)\/giphy.gif/g;

const getSchema = z.object({
  url: z.string().regex(giphyUrlRegexp, "Giphy URL is invalid"),
});

/**
 * This is an example endpoint for an app, these will run under `/api/integrations/[...args]`
 * @param req
 * @param res
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  try {
    const { url } = req.body;
    // Extract Giphy ID from embed url
    const matches = giphyUrlRegexp.exec(url);
    if (!matches || matches.length < 2) {
      return res.status(400).json({ message: "Giphy URL is invalid" });
    }
    const giphyId = matches[1];
    const gifImageUrl = await GiphyManager.getGiphyById(giphyId);
    return res.status(200).json({ image: gifImageUrl });
  } catch (error: unknown) {
    console.error({ error });
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500);
  }
}

function validate(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "POST") {
      try {
        getSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError && error?.name === "ZodError") {
          return res.status(400).json(error?.issues);
        }
        return res.status(402);
      }
    } else {
      return res.status(405);
    }
    await handler(req, res);
  };
}

export default validate(handler);

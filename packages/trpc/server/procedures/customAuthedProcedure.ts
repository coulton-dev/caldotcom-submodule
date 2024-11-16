import { TRPCError } from "@trpc/server";

import { middleware, procedure } from "../trpc";

const customAuthedProcedure = procedure.use(
  middleware(async ({ next, ctx: { req } }) => {
    if (req?.headers["dashboard-key"] != process.env.DASHBOARD_KEY) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next();
  })
);

export default customAuthedProcedure;

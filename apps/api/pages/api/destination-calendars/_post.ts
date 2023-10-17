import type { NextApiRequest } from "next";

import { HttpError } from "@calcom/lib/http-error";
import { defaultResponder } from "@calcom/lib/server";

import {
  schemaDestinationCalendarReadPublic,
  schemaDestinationCalendarCreateBodyParams,
} from "~/lib/validations/destination-calendar";

/**
 * @swagger
 * /destination-calendars:
 *   post:
 *     parameters:
 *       - in: query
 *         name: apiKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Your API key
 *     summary: Creates a new destination calendar
 *     requestBody:
 *       description: Create a new destination calendar for your events
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integration
 *               - externalId
 *               - credentialId
 *             properties:
 *               integration:
 *                 type: string
 *                 description: 'The integration'
 *               externalId:
 *                 type: string
 *                 description: 'The external ID of the integration'
 *               credentialId:
 *                 type: integer
 *                 description: 'The credential ID it is associated with'
 *               eventTypeId:
 *                 type: integer
 *                 description: 'The ID of the eventType it is associated with'
 *               bookingId:
 *                 type: integer
 *                 description: 'The booking ID it is associated with'
 *               userId:
 *                 type: integer
 *                 description: 'The user it is associated with'
 *     tags:
 *      - destination-calendars
 *     responses:
 *       201:
 *         description: OK, destination calendar created
 *       400:
 *        description: Bad request. DestinationCalendar body is invalid.
 *       401:
 *        description: Authorization information is missing or invalid.
 */
async function postHandler(req: NextApiRequest) {
  const { userId, isAdmin, prisma, body } = req;
  const parsedBody = schemaDestinationCalendarCreateBodyParams.parse(body);
  await checkPermissions(req, userId);

  const assignedUserId = isAdmin ? parsedBody.userId || userId : userId;

  /* Check if credentialId data matches the ownership and integration passed in */
  const credential = await prisma.credential.findFirst({
    where: { type: parsedBody.integration, userId: assignedUserId },
    select: { id: true, type: true, userId: true },
  });

  if (!credential)
    throw new HttpError({
      statusCode: 400,
      message: "Bad request, credential id invalid",
    });

  if (parsedBody.eventTypeId) {
    const eventType = await prisma.eventType.findFirst({
      where: { id: parsedBody.eventTypeId, userId: parsedBody.userId },
    });
    if (!eventType)
      throw new HttpError({
        statusCode: 400,
        message: "Bad request, eventTypeId invalid",
      });
    parsedBody.userId = undefined;
  }

  const destination_calendar = await prisma.destinationCalendar.create({ data: { ...parsedBody } });

  return {
    destinationCalendar: schemaDestinationCalendarReadPublic.parse(destination_calendar),
    message: "Destination calendar created successfully",
  };
}

async function checkPermissions(req: NextApiRequest, userId: number) {
  const { isAdmin } = req;
  const body = schemaDestinationCalendarCreateBodyParams.parse(req.body);

  /* Non-admin users can only create destination calendars for themselves */
  if (!isAdmin && body.userId)
    throw new HttpError({
      statusCode: 401,
      message: "ADMIN required for `userId`",
    });
  /* Admin users are required to pass in a userId */
  if (isAdmin && !body.userId) throw new HttpError({ statusCode: 400, message: "`userId` required" });
  /* User should only be able to create for their own destination calendars*/
  if (!isAdmin && body.eventTypeId) {
    const ownsEventType = await req.prisma.eventType.findFirst({ where: { id: body.eventTypeId, userId } });
    if (!ownsEventType) throw new HttpError({ statusCode: 401, message: "Unauthorized" });
  }
  // TODO:: Add support for team event types with validation
}

export default defaultResponder(postHandler);

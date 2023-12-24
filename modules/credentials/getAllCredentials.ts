import { Prisma } from "@prisma/client";
import prisma, { userSelect } from "@calcom/prisma";
import { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
import type { CredentialPayload } from "@calcom/types/Credential";
import { getEventTypesFromDB } from "@calcom/features/bookings/lib/handleNewBooking";

type User = Prisma.UserGetPayload<typeof userSelect>;

/**
 * Gets credentials from the user, team, and org if applicable
 *
 */
export const getAllCredentials = async (
    user: User & { credentials: CredentialPayload[] },
    eventType: Awaited<ReturnType<typeof getEventTypesFromDB>>
) => {
    const allCredentials = user.credentials;

    // If it's a team event type query for team credentials
    if (eventType.team?.id) {
        const teamCredentialsQuery = await prisma.credential.findMany({
            where: {
                teamId: eventType.team.id,
            },
            select: credentialForCalendarServiceSelect,
        });
        allCredentials.push(...teamCredentialsQuery);
    }

    // If it's a managed event type, query for the parent team's credentials
    if (eventType.parentId) {
        const teamCredentialsQuery = await prisma.team.findFirst({
            where: {
                eventTypes: {
                    some: {
                        id: eventType.parentId,
                    },
                },
            },
            select: {
                credentials: {
                    select: credentialForCalendarServiceSelect,
                },
            },
        });
        if (teamCredentialsQuery?.credentials) {
            allCredentials.push(...teamCredentialsQuery?.credentials);
        }
    }

    // If the user is a part of an organization, query for the organization's credentials
    if (user?.organizationId) {
        const org = await prisma.team.findUnique({
            where: {
                id: user.organizationId,
            },
            select: {
                credentials: {
                    select: credentialForCalendarServiceSelect,
                },
            },
        });

        if (org?.credentials) {
            allCredentials.push(...org.credentials);
        }
    }

    return allCredentials;
};

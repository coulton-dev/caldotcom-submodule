import { expect } from "@playwright/test";
import type { createUsersFixture } from "playwright/fixtures/users";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { generateHashedLink } from "@calcom/lib/generateHashedLink";

import { test } from "../lib/fixtures";
import { bookEventOnThisPage } from "../lib/testUtils";

test.describe.configure({ mode: "parallel" });

const orgSlug = "example";

function getOrgOrigin(orgSlug: string | null) {
  if (!orgSlug) {
    throw new Error("orgSlug is required");
  }

  let orgOrigin = WEBAPP_URL.replace("://app", `://${orgSlug}`);
  orgOrigin = orgOrigin.includes(orgSlug) ? orgOrigin : WEBAPP_URL.replace("://", `://${orgSlug}.`);
  return orgOrigin;
}

async function createUserWithOrganizationAndTeam(users: ReturnType<typeof createUsersFixture>) {
  const orgOwnerUsernamePrefix = "owner";
  const orgOwnerEmail = users.trackEmail({
    username: orgOwnerUsernamePrefix,
    domain: `example.com`,
  });
  const orgOwnerUser = await users.create(
    {
      username: orgOwnerUsernamePrefix,
      email: orgOwnerEmail,
      role: "ADMIN",
      roleInOrganization: "OWNER",
    },
    {
      isOrg: true,
      isUnpublished: true,
      orgRequestedSlug: orgSlug,
      hasSubteam: true,
      hasTeam: true,
    }
  );
  return orgOwnerUser;
}

test.describe("Unpublished Organization", () => {
  test.afterEach(({ orgs, users }) => {
    orgs.deleteAll();
    users.deleteAll();
  });

  test.describe("Team Profile & Event", () => {
    // Main test for redirection feature
    test("Cannot see team profile when visiting directly", async ({ page, users }) => {
      const orgOwner = await createUserWithOrganizationAndTeam(users);

      const { team } = await orgOwner.getFirstTeamMembership();

      await page.goto(`http://${orgSlug}.cal.local:3000/${team.slug}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("empty-screen")).toBeVisible();

      // make sure that team profile is not visible
      await expect(page.getByTestId("team-name")).toHaveCount(0);
    });
    test("Can see team profile and book event when orgRedirection=true query param present", async ({
      page,
      users,
    }) => {
      const orgOwner = await createUserWithOrganizationAndTeam(users);
      const { team } = await orgOwner.getFirstTeamMembership();
      await page.goto(`http://${orgSlug}.cal.local:3000/${team.slug}?orgRedirection=true`);
      await test.step("Profile visible", async () => {
        await page.waitForLoadState("networkidle");

        // make sure that team profile is visibles
        await expect(page.getByTestId("team-name")).toBeVisible();
      });
      await test.step("Browsing to an event", async () => {
        page.getByTestId("event-type-link").first().click();
        await page.waitForURL((url) => {
          return (
            url.searchParams.get("orgRedirection") === "true" && url.pathname.startsWith(`/${team.slug}/`)
          );
        });
        await expect(page.getByTestId("event-title")).toBeVisible();
      });
      await test.step("Book event", async () => {
        await bookEventOnThisPage(page);
      });
    });
    //   page,
    //   users,
    //   orgs,
    // }) => {
    //   // const org = await orgs.create({
    //   //   name: "Example Org",
    //   //   requestedSlug: orgSlug,
    //   // });
    //   const teamOwnerUsernamePrefix = "owner";
    //   const teamOwnerEmail = users.trackEmail({
    //     username: teamOwnerUsernamePrefix,
    //     domain: `example.com`,
    //   });
    //   const teamOwnerUser = await users.create(
    //     {
    //       username: teamOwnerUsernamePrefix,
    //       email: teamOwnerEmail,
    //       role: "ADMIN",

    //       roleInOrganization: "OWNER",
    //     },
    //     {
    //       hasTeam: true,
    //       isOrg: true,
    //       hasSubteam: true,
    //       isUnpublished: true,
    //     }
    //   );
    //   const { team, role } = await teamOwnerUser.getFirstTeamMembership();
    //   await page.goto(`http://${orgSlug}.cal.local:3000/${team.slug}?orgRedirection=true`);
    //   await test.step("Profile visible", async () => {
    //     await page.waitForLoadState("networkidle");

    //     // make sure that team profile is visibles
    //     await expect(page.locator('[data-testid="name-title"]')).toBeVisible();
    //     await expect(page.locator('[data-testid="event-types"]')).toBeVisible();
    //   });
    //   await test.step("Browsing to an event", async () => {
    //     page.getByTestId("event-type-link").first().click();
    //     await page.waitForURL((url) => {
    //       return (
    //         url.searchParams.get("orgRedirection") === "true" && url.pathname.startsWith(`/${team.slug}/`)
    //       );
    //     });
    //     await expect(page.getByTestId("event-title")).toBeVisible();
    //   });
    //   await test.step("Book event", async () => {
    //     await bookEventOnThisPage(page);
    //   });
    // });
  });
  test.describe("User Profile & Event", () => {
    // Main test for redirection feature
    test("Cannot see user profile when visiting directly", async ({ page, users }) => {
      const orgOwner = await createUserWithOrganizationAndTeam(users);

      await page.goto(`http://${orgSlug}.cal.local:3000/${orgOwner.username}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("empty-screen")).toBeVisible();

      // make sure that user profile is not visibles
      await expect(page.locator('[data-testid="name-title"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="event-types"]')).toHaveCount(0);
    });
    test("Can see user profile and book event when orgRedirection=true query param present", async ({
      page,
      users,
    }) => {
      const orgOwner = await createUserWithOrganizationAndTeam(users);
      await page.goto(`http://${orgSlug}.cal.local:3000/${orgOwner.username}?orgRedirection=true`);
      await test.step("Profile visible", async () => {
        await page.waitForLoadState("networkidle");

        // make sure that user profile is visibles
        await expect(page.locator('[data-testid="name-title"]')).toBeVisible();
        await expect(page.locator('[data-testid="event-types"]')).toBeVisible();
      });
      await test.step("Browsing to an event", async () => {
        page.getByTestId("event-type-link").first().click();
        await page.waitForURL((url) => {
          return (
            url.searchParams.get("orgRedirection") === "true" &&
            url.pathname.startsWith(`/${orgOwner.username}/`)
          );
        });
        await expect(page.getByTestId("event-title")).toBeVisible();
      });
      await test.step("Book event", async () => {
        await bookEventOnThisPage(page);
      });
    });
  });
  test.describe("Private URL", () => {
    test("Cannot see event when visiting private URL directly", async ({ page, users, prisma }) => {
      const orgOwner = await createUserWithOrganizationAndTeam(users);
      const eventType = await orgOwner.getFirstEventAsOwner();
      // make event have an hashedUrl so it is private
      const privateEvent = await prisma.eventType.update({
        where: {
          id: eventType.id,
        },
        data: {
          hashedLink: {
            create: {
              link: generateHashedLink(eventType.id),
            },
          },
        },
        include: {
          hashedLink: true,
        },
      });

      await page.goto(
        `http://${orgSlug}.cal.local:3000/d/${privateEvent.hashedLink?.link}/${privateEvent.slug}`
      );
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("empty-screen")).toBeVisible();
    });

    test("Can see event and book event when orgRedirection=true query param present", async ({
      page,
      users,
      prisma,
    }) => {
      const orgOwner = await createUserWithOrganizationAndTeam(users);
      const eventType = await orgOwner.getFirstEventAsOwner();
      // make event have an hashedUrl so it is private
      const privateEvent = await prisma.eventType.update({
        where: {
          id: eventType.id,
        },
        data: {
          hashedLink: {
            create: {
              link: generateHashedLink(eventType.id),
            },
          },
        },
        include: {
          hashedLink: true,
        },
      });

      await page.goto(
        `http://${orgSlug}.cal.local:3000/d/${privateEvent.hashedLink?.link}/${privateEvent.slug}?orgRedirection=true`
      );
      await test.step("Profile visible", async () => {
        await page.waitForLoadState("networkidle");

        // make sure that event is visibles
        await expect(page.getByTestId("event-title")).toBeVisible();
      });
      await test.step("Book event", async () => {
        await bookEventOnThisPage(page);
      });
    });
  });
});

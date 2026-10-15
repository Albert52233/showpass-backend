import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";

const password = "Showpass-test-password-123";
async function register(page: Page, email: string) {
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function seed(request: APIRequestContext) {
  const id = randomUUID().slice(0, 8);
  const email = `browser-${id}@example.com`;
  const auth = await request.post("/api/auth/register", {
    data: { email, password },
  });
  expect(auth.status()).toBe(201);
  const { access_token } = await auth.json();
  const headers = { Authorization: `Bearer ${access_token}` };
  const venueResponse = await request.post("/api/venues", {
    headers,
    data: {
      name: `Test Hall ${id}`,
      address: "42 Experience Avenue",
      capacity: 20,
    },
  });
  expect(venueResponse.status()).toBe(201);
  const venue = await venueResponse.json();
  const makeEvent = async (title: string) => {
    const response = await request.post("/api/events", {
      headers,
      data: {
        title,
        description: "A live experience made for browser testing.",
        venueId: venue.id,
        startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(),
        capacity: 20,
        priceCents: 0,
      },
    });
    expect(response.status()).toBe(201);
    return response.json();
  };
  const event = await makeEvent(`Live sessions ${id}`);
  const draft = await makeEvent(`Unpublished ${id}`);
  const published = await request.patch(`/api/events/${event.id}/status`, {
    headers,
    data: { status: "PUBLISHED" },
  });
  expect(published.ok()).toBeTruthy();
  return { event, draft, email };
}

test("organizer and attendee journey uses the real API", async ({ page }) => {
  const id = randomUUID().slice(0, 8);
  const title = `After hours ${id}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await register(page, `frontend-${id}@example.com`);
  await page.getByRole("link", { name: /Organizer studio/ }).click();
  await page.getByRole("button", { name: "Add venue", exact: true }).click();
  await page.getByLabel("Venue name").fill(`The Listening Room ${id}`);
  await page
    .getByLabel("Address", { exact: true })
    .fill("10 Music Lane, Portland");
  await page.getByLabel("Capacity", { exact: true }).fill("10");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add venue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Create event", exact: true }).click();
  await page.getByLabel("Event title").fill(title);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Intimate sounds. A room full of good people.");
  await page
    .getByRole("combobox", { name: "Venue", exact: true })
    .selectOption({ label: `The Listening Room ${id} · 10 capacity` });
  const start = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);
  const end = new Date(Date.now() + 86400000 * 3 + 7200000)
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("Starts", { exact: true }).fill(start);
  await page.getByLabel("Ends", { exact: true }).fill(end);
  await page.getByLabel("Ticket capacity").fill("2");
  await page.getByLabel("Price per ticket (USD)").fill("12.50");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  const studioEvent = page.locator(".studio-event").filter({ hasText: title });
  await expect(studioEvent.getByText("Draft", { exact: true })).toBeVisible();
  await studioEvent
    .getByRole("button", { name: "Publish event", exact: true })
    .click();
  await studioEvent
    .getByRole("button", { name: "Open sales", exact: true })
    .click();
  await expect(
    studioEvent.getByRole("button", { name: "Mark sold out", exact: true }),
  ).toBeDisabled();
  await expect(
    studioEvent.getByRole("button", { name: "Complete event", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Discover", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search events" }).fill(title);
  await page
    .getByRole("button", { name: `View ${title}`, exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("$12.50", { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reserve tickets", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .locator(".wallet-ticket")
      .getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel reservation", exact: true })
    .click();
  await expect(
    page.locator(".wallet-ticket").getByText("Cancelled", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Discover", exact: true }).click();
  await page
    .getByRole("button", { name: `View ${title}`, exact: true })
    .click();
  await page.getByRole("button", { name: "More tickets", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("$25", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reserve tickets", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm demo payment", exact: true })
    .click();
  await expect(page.locator(".status-paid")).toHaveText("Paid");
  await page.getByRole("link", { name: /Organizer studio/ }).click();
  await studioEvent
    .getByRole("button", { name: "Mark sold out", exact: true })
    .click();
  await expect(
    studioEvent.getByText("Sold out", { exact: true }),
  ).toBeVisible();
  await expect(
    studioEvent.getByRole("button", { name: "Open sales", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign in to continue" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign in to continue" }).click();
  await page.getByLabel("Email address").fill(`frontend-${id}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    studioEvent.getByText("Sold out", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    studioEvent.getByText("Sold out", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("discovery filters real events and keeps unpublished drafts out of discovery", async ({
  page,
  request,
}) => {
  const { event, draft } = await seed(request);
  await page.goto("/");
  await page
    .getByRole("searchbox", { name: "Search events" })
    .fill(event.title);
  await expect(
    page.getByRole("button", { name: `View ${event.title}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "On sale now", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing here. Something out there." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search events" })
    .fill(draft.title);
  await expect(
    page.getByRole("button", { name: `View ${draft.title}`, exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("searchbox", { name: "Search events" })
    .fill(event.title);
  await page.getByRole("button", { name: "Free to go", exact: true }).click();
  await page
    .getByRole("button", { name: `View ${event.title}`, exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Tickets are coming soon.", { exact: false }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("invalid login is actionable and a signed-out wallet requires authentication", async ({
  page,
}) => {
  await page.goto("/#tickets");
  await page.getByRole("button", { name: "Sign in to continue" }).click();
  await page
    .getByLabel("Email address")
    .fill(`missing-${randomUUID()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveText(
    "Email or password is incorrect.",
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in to continue" }),
  ).toBeVisible();
});

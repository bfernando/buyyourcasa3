import { expect, test } from "@playwright/test";

const FACEBOOK_IOS_IN_APP_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23E261 Safari/604.1 [FBAN/FBIOS;FBAV/561.0.0.61.68;FBBV/968394897;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/26.4.2;FBSS/3;FBID/phone;FBLC=en_US;FBOP/5;FBRV/976108093;IABMV/1]";

const FUNNEL_URL =
  process.env.FACEBOOK_FUNNEL_URL ??
  "https://www.buyyour.casa/es/m?utm_source=facebook&utm_medium=paid_social&utm_campaign=repeatable_facebook_iab_check&fbclid=repeatable-facebook-iab";

const RUN_START_CALL_CHECK = process.env.CHECK_FACEBOOK_FUNNEL_START_CALL === "1";

type CapturedClientEvent = {
  event?: string;
  details?: Record<string, unknown>;
};

test.use({
  userAgent: FACEBOOK_IOS_IN_APP_USER_AGENT,
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  extraHTTPHeaders: {
    referer: "https://www.facebook.com/",
  },
});

test("Facebook iPhone in-app browser opens Spanish form-first funnel", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.goto(FUNNEL_URL, { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(/Mi Casa Investment Group/);
  await expect(page.getByText("Vende Rápido.")).toBeVisible();
  await expect(page.getByText("Tu oferta está a")).toBeVisible();
  await expect(page.getByLabel("Dirección de la Propiedad")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Toca para Hablar" }),
  ).toHaveCount(0);

  await expect(
    page.getByText(/Unhandled Runtime Error|Application error|Next\.js|Vite/),
  ).toHaveCount(0);

  await expect
    .poll(() => page.evaluate(() => document.referrer))
    .toBe("https://www.facebook.com/");
  await expect
    .poll(() => page.evaluate(() => navigator.userAgent))
    .toContain("FBAN/FBIOS");

  expect(
    browserErrors.filter(
      (message) =>
        !message.includes("Failed to load resource: the server responded with a status of 404") &&
        !message.includes(
          "Ignoring settings for browser- or platform-unsupported input processor(s): audio",
        ),
    ),
  ).toEqual([]);
});

test("Facebook iPhone in-app browser can start the audio call", async ({
  context,
  page,
}) => {
  test.skip(
    !RUN_START_CALL_CHECK,
    "Set CHECK_FACEBOOK_FUNNEL_START_CALL=1 to run the live Vapi start-call check.",
  );

  const origin = new URL(FUNNEL_URL).origin;
  await context.grantPermissions(["microphone"], { origin });

  const clientEvents: CapturedClientEvent[] = [];
  const browserErrors: string[] = [];

  await page.route("**/api/client-events", async (route) => {
    const request = route.request();
    const postData = request.postData();
    if (request.method() === "POST" && postData) {
      try {
        clientEvents.push(JSON.parse(postData) as CapturedClientEvent);
      } catch {
        browserErrors.push("Unable to parse client event payload");
      }
    }
    await route.continue();
  });

  page.on("pageerror", (error) => browserErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.goto(FUNNEL_URL, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("Es posible que este navegador no escuche tu voz"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Toca para Hablar" }).click();

  await expect
    .poll(
      () =>
        clientEvents.some((event) => event.event === "voice_start_attempt"),
      { timeout: 10_000 },
    )
    .toBe(true);

  await expect
    .poll(
      () =>
        clientEvents.some(
          (event) =>
            event.event === "voice_audio_unlock_result" &&
            event.details?.audioElement === "played",
        ),
      { timeout: 10_000 },
    )
    .toBe(true);

  await expect
    .poll(
      () =>
        clientEvents.some(
          (event) =>
            event.event === "voice_call_started" ||
            event.event === "voice_call_start_failed" ||
            event.event?.startsWith("voice_error_"),
        ),
      { timeout: 45_000 },
    )
    .toBe(true);

  const failureEvent = clientEvents.find(
    (event) =>
      event.event === "voice_call_start_failed" ||
      event.event?.startsWith("voice_error_"),
  );
  expect(failureEvent, JSON.stringify(failureEvent, null, 2)).toBeUndefined();

  await expect
    .poll(
      () =>
        clientEvents.some(
          (event) =>
            event.event === "voice_assistant_audio_detected" ||
            event.event === "voice_assistant_speech_started",
        ),
      { timeout: 45_000 },
    )
    .toBe(true);

  expect(
    browserErrors.filter(
      (message) =>
        !message.includes("Failed to load resource: the server responded with a status of 404") &&
        !message.includes(
          "Ignoring settings for browser- or platform-unsupported input processor(s): audio",
        ),
    ),
  ).toEqual([]);
});

import { chromium } from "playwright-core";

function parseArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const url = parseArg("--url");
const waitSelector = parseArg("--wait-selector");
const executablePath = parseArg("--executable-path");
const timeoutMs = Number.parseInt(parseArg("--timeout-ms", "90000"), 10);

if (!url) {
  console.error("Missing required argument: --url");
  process.exit(1);
}

if (!executablePath) {
  console.error("Missing required argument: --executable-path");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: timeoutMs });
  }
  await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => {});
  process.stdout.write(await page.content());
} finally {
  await browser.close();
}

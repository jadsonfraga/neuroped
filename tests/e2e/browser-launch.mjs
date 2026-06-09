import { existsSync } from "node:fs";
import { chromium } from "playwright";

const localBrowserCandidates = [
  process.env.E2E_BROWSER_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

export async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const browserPath = localBrowserCandidates.find((candidate) => existsSync(candidate));
    if (!browserPath) throw error;
    return chromium.launch({ headless: true, executablePath: browserPath });
  }
}

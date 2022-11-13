import puppeteer from "puppeteer-extra";
import {
  DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  executablePath,
} from "puppeteer";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import metaScraperAuthor from "metascraper-author";
import metascraperDate from "metascraper-date";
import metaScraperDescription from "metascraper-description";
import metaScraperImage from "metascraper-image";
import metaScraperLogo from "metascraper-logo";
import metaScraperTitle from "metascraper-title";
import metaScraperClearbit from "metascraper-clearbit";
import metaScraperUrl from "metascraper-url";
import metaScraperPublisher from "metascraper-publisher";
import metaScraper from "metascraper";

puppeteer.use(
  AdblockerPlugin({
    blockTrackers: true,
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  })
);
puppeteer.use(StealthPlugin());

let browserUrl: string;

const getContent = async (url: string): Promise<string | null> => {
  const browser = browserUrl
    ? await puppeteer.connect({
        browserURL: browserUrl,
        defaultViewport: null,
      })
    : await puppeteer.launch({
        headless: true,
        executablePath: executablePath(),
        args: ["--no-sandbox"],
      });
  const page = (await browser.pages())[0];

  if (!browserUrl) browserUrl = browser.target().url();

  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 5000 });
  } finally {
    try {
      const html = await page.evaluate(
        () => document.querySelector("*").outerHTML
      );
      setTimeout(async () => {
        try {
          await page.close().catch(() => {});
          browser.disconnect();
        } catch {}
      });
      return html;
    } catch {
      try {
        setTimeout(async () => {
          try {
            await page.close().catch(() => {});
            browser.disconnect();
          } catch {}
        });
        return null;
      } catch {}
    }
  }
};

const metascraper = metaScraper([
  metaScraperAuthor(),
  metascraperDate(),
  metaScraperDescription(),
  metaScraperAuthor(),
  metaScraperLogo(),
  metaScraperClearbit(),
  metaScraperPublisher(),
  metaScraperTitle(),
  metaScraperUrl(),
  metaScraperImage(),
]);

export default async function metadataScraper(url: string) {
  try {
    const html = await getContent(url);
    if (!html) return null;
    const metadata = await metascraper({
      url,
      html,
    });
    return metadata;
  } catch {
    return null;
  }
}

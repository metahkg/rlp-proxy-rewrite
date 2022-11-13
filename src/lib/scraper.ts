import puppeteer from "puppeteer-extra";
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY, executablePath } from "puppeteer";
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

let browserWSEndpoint: string;

const getContent = async (url: string): Promise<string | null> => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath(),
    args: ["--no-sandbox"],
    ...(browserWSEndpoint && { browserWSEndpoint }),
  });
  browserWSEndpoint = browser.wsEndpoint();
  const page = await browser.newPage();
  try {
    const html: string = await new Promise(async (resolve, reject) => {
      setTimeout(() => {
        reject("timeout");
      }, 5000);
      try {
        await page.goto(url, { waitUntil: "networkidle0" });
        const data = await page.evaluate(
          () => document.querySelector("*").outerHTML
        );
        await page.close();
        browser.disconnect();
        resolve(data);
      } catch (err) {
        reject("error");
      }
    });
    return html;
  } catch (err) {
    return null;
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

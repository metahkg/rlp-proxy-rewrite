import puppeteer from "puppeteer-extra";
import {
    Browser,
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
import metaScraperManifest from "metascraper-manifest";
import metaScraperAmazon from "metascraper-amazon";
import metaScraperInstagram from "metascraper-instagram";
import metaScraperSoundCloud from "metascraper-soundcloud";
import metaScraperTelegram from "metascraper-telegram";
import metaScraperUOL from "metascraper-uol";
import metaScraperSpotify from "metascraper-spotify";
import metaScraperTwitter from "metascraper-twitter";
import metaScraperYoutube from "metascraper-youtube";
import metaScraper from "metascraper";

puppeteer.use(
    AdblockerPlugin({
        blockTrackers: true,
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    }),
);
puppeteer.use(StealthPlugin());

let browser: Browser;

export async function initBrowser() {
    browser = await puppeteer.launch({
        headless: JSON.parse(process.env.NO_HEADLESS || "false") ? false : true,
        executablePath: executablePath(),
        args: ["--no-sandbox"],
    });
}

async function getContent(url: string): Promise<string | null> {
    // if browser crashed / closed
    if (!browser) {
        await initBrowser();
    }

    while ((await browser.pages()).length > 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 4000 });
    } finally {
        try {
            const html = await page.evaluate(() => document.querySelector("*").outerHTML);
            setTimeout(async () => {
                try {
                    await page.close();
                } catch {
                    // do nothing if failed
                }
            });
            return html;
        } catch {
            try {
                setTimeout(async () => {
                    try {
                        await page.close();
                    } catch {
                        // do nothing if failed
                    }
                });
            } finally {
                return null;
            }
        }
    }
}

const metascraper = metaScraper([
    metaScraperAmazon(),
    metaScraperClearbit(),
    metaScraperInstagram(),
    metaScraperSoundCloud(),
    metaScraperSoundCloud(),
    metaScraperTelegram(),
    metaScraperUOL(),
    metaScraperSpotify(),
    metaScraperTwitter(),
    metaScraperYoutube(),
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
    metaScraperManifest(),
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

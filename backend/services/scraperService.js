const puppeteer = require('puppeteer');
const crypto = require('crypto');

class ScraperService {
    constructor() {
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some server environments
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Scrapes a URL and returns content + hash + screenshot
     * @param {string} url 
     */
    async scrape(url) {
        let page = null;
        try {
            await this.init();
            page = await this.browser.newPage();

            // Set User Agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Navigate
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // extract main content
            const content = await page.evaluate(() => {
                // remove scripts, styles, etc.
                const scripts = document.querySelectorAll('script, style, noscript, iframe');
                scripts.forEach(s => s.remove());

                return {
                    title: document.title,
                    h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText),
                    text: document.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 10000) // limit text
                };
            });

            // Compute Hash for "Change Detection"
            const hash = crypto.createHash('md5').update(content.text).digest('hex');

            // TODO: Screenshot capability (optional for now to save space)
            // const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });

            return {
                ...content,
                hash,
                scrapedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Scrape failed for ${url}:`, error.message);
            throw error;
        } finally {
            if (page) await page.close();
            // We keep the browser open for performance if we are doing a batch, 
            // but for single runs we might want to close or manage lifecycle.
            // For now, let's keep it singleton.
        }
    }
}

module.exports = new ScraperService();

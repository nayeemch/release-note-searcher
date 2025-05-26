import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.time('⏱️ Total Execution Time'); // Start timer to measure execution duration

  // URL of the BuddyBoss release notes landing page
  const baseURL = 'https://www.buddyboss.com/resources/release-notes/';

  // File paths for storing scraped changelog URLs and all release data
  const scrapedFile = 'scraped-urls.json';
  const releaseFile = 'all-releases.json';

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: true, // Run in headless mode (no visible browser window)
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Improves compatibility in some environments
  });

  const page = await browser.newPage(); // Create a new browser tab/page

  // Go to the main release notes page
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' }); // Load basic DOM (faster than waiting for full load)

  // Wait for the product grid to appear (small timeout avoids long delay if slow)
  await page.waitForSelector('.release-dir-items-wrap.model', { timeout: 1000 });

  // Load previously scraped changelog URLs to avoid duplicate scraping
  let scrapedUrls = new Set();
  if (fs.existsSync(scrapedFile) && fs.readFileSync(scrapedFile, 'utf8').trim()) {
    scrapedUrls = new Set(JSON.parse(fs.readFileSync(scrapedFile, 'utf8')));
    console.log(`🔍 Loaded ${scrapedUrls.size} previously scraped URLs`);
  }

  // Extract product titles and their "View All Releases" URLs from the main page
  const productData = await page.$$eval('.release-dir-items-wrap.model', items =>
    items.map(item => ({
      title: item.querySelector('h3.model-title')?.innerText.trim(),
      href: item.querySelector('.release-dir-item-link a')?.href,
    })).filter(p => p.title && p.href) // Filter out incomplete entries
  );

  console.log(`🔗 Found ${productData.length} products`);

  const allReleaseData = []; // Array to hold newly scraped release data

  // Loop through each product and visit their release logs page
  for (const { title: productTitle, href: releaseUrl } of productData) {
    console.log(`\n➡️ Scraping: ${productTitle}`);
    await page.goto(releaseUrl, { waitUntil: 'networkidle2' }); // Wait for network to be mostly idle

    // If there's no release table, skip this product
    try {
      await page.waitForSelector('.bb-cli-table tbody tr', { timeout: 10000 });
    } catch {
      console.warn(`⚠️ No release table for ${releaseUrl}`);
      continue;
    }

    // Extract each row of the release table (version, date, changelog URL)
    const rows = await page.$$eval('.bb-cli-table tbody tr', trs =>
      trs.map(tr => {
        const tds = tr.querySelectorAll('td');
        const version = tds[0]?.innerText.trim() || '';
        const date = tds[1]?.innerText.trim() || '';
        const changelogUrl = [...tr.querySelectorAll('a')]
          .find(a => a.innerText.trim() === 'Changelog')?.href || null;
        return { version, date, changelogUrl };
      })
    );

    // Loop through each release entry and scrape changelog content if not already scraped
    for (const { version, date, changelogUrl } of rows) {
      if (!changelogUrl) {
        console.log(`❌ No changelog for ${version}`);
        continue; // Skip if no changelog link
      }

      if (scrapedUrls.has(changelogUrl)) {
        console.log(`🔁 Skipping already scraped: ${productTitle} ${version}`);
        continue; // Skip if already scraped previously
      }

      try {
        const changelogPage = await browser.newPage(); // Open new page for each changelog
        await changelogPage.goto(changelogUrl, { waitUntil: 'networkidle2' });

        // Extract changelog page title (usually like "BuddyBoss Platform - Version x.x.x")
        const title = await changelogPage.$eval('.entry-title', el => el.innerText.trim());

        // Extract the list items from the first unordered list (change entries)
        const changelogcontent = await changelogPage.$$eval(
          '.entry-reference ul:first-of-type li',
          items => items.map(li => li.innerText.trim())
        );

        // Store the scraped release data
        allReleaseData.push({ product: productTitle, version, date, title, changelogcontent });

        // Mark this changelog as scraped
        scrapedUrls.add(changelogUrl);

        console.log(`✅ Scraped: ${productTitle} ${version} - ${title}`);
        await changelogPage.close(); // Close the tab
      } catch (err) {
        console.error(`❌ Error scraping ${version}: ${err.message}`);
      }
    }
  }

  // Load existing data to preserve older records
  let previousData = [];
  if (fs.existsSync(releaseFile) && fs.readFileSync(releaseFile, 'utf8').trim()) {
    previousData = JSON.parse(fs.readFileSync(releaseFile, 'utf8'));
  }

  // Combine new and existing data (if any)
  const combinedData = [...previousData, ...allReleaseData];

  // Save final combined release data and updated scraped URL list
  fs.writeFileSync(releaseFile, JSON.stringify(combinedData, null, 2));
  fs.writeFileSync(scrapedFile, JSON.stringify([...scrapedUrls], null, 2));

  console.log(`\n🎉 Saved ${combinedData.length} total releases to ${releaseFile}`);

  await browser.close(); // Close browser instance
  console.timeEnd('⏱️ Total Execution Time'); // Stop timer and print execution duration
})();

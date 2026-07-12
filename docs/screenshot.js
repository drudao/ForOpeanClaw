#!/usr/bin/env node
/**
 * Screenshot script - Opens a URL with Puppeteer and outputs a PNG screenshot.
 * Usage: node screenshot.js <URL> <output-file.png>
 * 
 * Called by Java backend via ProcessBuilder.
 */

const puppeteer = require('puppeteer');

async function main() {
  const url = process.argv[2];
  const outputFile = process.argv[3];

  if (!url || !outputFile) {
    console.error('Usage: node screenshot.js <URL> <output-file.png>');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any animations
    await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

    // Take screenshot
    await page.screenshot({
      path: outputFile,
      fullPage: true,
      type: 'png'
    });

    console.log(`SUCCESS: Screenshot saved to ${outputFile}`);
  } catch (err) {
    // Even if navigation fails, try to take a screenshot of the error page
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { timeout: 15000 }).catch(() => {});
      await page.screenshot({
        path: outputFile,
        fullPage: false,
        type: 'png'
      });
      console.log(`PARTIAL: Screenshot (error page) saved to ${outputFile}`);
    } catch (e2) {
      console.error(`FAILED: ${err.message}`);
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(`FAILED: ${err.message}`);
  process.exit(1);
});

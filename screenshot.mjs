import puppeteer from 'puppeteer';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const vpWidth = parseInt(process.argv[4]) || 1440;
const vpHeight = parseInt(process.argv[5]) || 900;
const dir = join(__dirname, 'temporary screenshots');

// auto-increment index
let idx = 1;
try {
  const files = readdirSync(dir).filter(f => f.startsWith('screenshot-'));
  if (files.length) {
    const nums = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0')).filter(Boolean);
    idx = Math.max(...nums) + 1;
  }
} catch { /* dir doesn't exist yet */ }

import { mkdirSync } from 'fs';
try { mkdirSync(dir, { recursive: true }); } catch {}

const filename = `screenshot-${idx}${label}.png`;
const outPath = join(dir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: vpWidth, height: vpHeight });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);

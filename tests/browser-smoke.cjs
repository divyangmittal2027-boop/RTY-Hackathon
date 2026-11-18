const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(String(error)));
  await page.goto('http://127.0.0.1:8080/', { waitUntil:'domcontentloaded', timeout:30000 });
  await page.waitForSelector('#sheet-content .sheet-heading', {timeout:20000});
  await page.waitForTimeout(8500);
  console.log('Live directory state:', await page.locator('#sheet-content .sheet-heading p').textContent());
  console.log('Map location message:', await page.locator('#location-message').textContent());
  await page.screenshot({ path: 'artifacts/naari-map.png', fullPage: true });
  if (!(await page.locator('#sheet-content').innerText()).includes('Delhi')) throw Error('Map panel missing Delhi');
  await page.locator('#city-strip [data-city="gurugram"]').click();
  if (!(await page.locator('#sheet-content .sheet-heading').innerText()).includes('Gurugram')) throw Error('City selection failed');
  await page.locator('#sheet-content .place-row').first().click();
  await page.waitForSelector('#rate-current');
  await page.locator('#rate-current').click();
  await page.waitForSelector('#rate-dialog[open]');
  await page.locator('#rate-form').evaluate(form => form.requestSubmit());
  await page.locator('#rate-dialog').waitFor({ state: 'hidden' });
  const localReview = await page.evaluate(() => localStorage.getItem('naari-map-reviews-2026-11-18'));
  if (!localReview || localReview==='{}') throw Error('Rating did not persist locally');
  await page.screenshot({ path: 'artifacts/naari-detail.png', fullPage: true });
  await page.locator('.bottom-tabs [data-tab="profile"]').click();
  if (!(await page.locator('#my-ratings').innerText()).includes('Safety')) throw Error('My ratings not populated');
  await page.screenshot({ path: 'artifacts/naari-profile.png', fullPage: true });
  // Original Naari is inspected as a design reference only: never import its code.
  const reference = await browser.newPage({ viewport:{ width:390, height:844 } });
  for (const url of [
    'https://naari-divyangmittal2027-7248.vercel.app/',
    'https://solo-shield-1.emergent.host/'
  ]) {
    try {
      await reference.goto(url, { waitUntil:'domcontentloaded', timeout:12000 });
      await reference.waitForTimeout(1200);
      await reference.screenshot({ path:'artifacts/naari-original-reference.png', fullPage:true });
      console.log('Captured original Naari UI for comparison:',url);
      break;
    } catch (error) { console.log('Original reference unavailable at:',url,String(error).slice(0,120)); }
  }
  await reference.setViewportSize({ width:1280, height:800 });
  try {
    await reference.reload({ waitUntil:'domcontentloaded',timeout:12000 });
    await reference.waitForTimeout(900);
    await reference.screenshot({ path:'artifacts/naari-original-desktop.png' });
  } catch (err) { console.log('Desktop reference screenshot unavailable:',String(err).slice(0,100)); }
  await reference.close();
  const desktop=await browser.newPage({ viewport:{ width:1280,height:800 } });
  await desktop.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  await desktop.waitForSelector('#sheet-content .sheet-heading');
  await desktop.screenshot({ path:'artifacts/naari-new-desktop.png' });
  await desktop.close();
  if (browserErrors.length) throw Error('Browser runtime errors: '+browserErrors.join('; '));
  await browser.close();
  console.log('Naari E2E PASS: map, city switch, detail, rating persistence, profile');
})().catch(error => { console.error(error); process.exit(1); });

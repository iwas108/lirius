const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept dialogs (alerts, etc) to auto-accept them, just in case
  page.on('dialog', dialog => dialog.accept());

  // Navigate to dev server
  await page.goto('http://localhost:5173/lirius/dist/');

  // Wait for the app to load
  await page.waitForSelector('text=Create New Project');

  // Click 'Create New Project'
  await page.click('text=Create New Project');

  // Fill project name and lyrics
  await page.fill('input[placeholder="e.g. Bohemian Rhapsody"]', 'Test Lirius Export');
  await page.fill('textarea[placeholder="Paste your lyrics here..."]', 'Line 1\nLine 2');

  // Submit create project form
  await page.click('button[type="submit"]:has-text("Create Project")');

  // We are now in Synchronizer.
  // We should see a header with the project name "Test Lirius Export"
  await page.waitForSelector('h1:has-text("Test Lirius Export")');

  // Create a dummy audio file
  const dummyAudioPath = path.join(__dirname, 'dummy.flac');

  // Set audio file to enable isReady
  await page.setInputFiles('input[type="file"]', dummyAudioPath);

  // Wait for export button and click it
  await page.waitForSelector('button:has-text("Export")', { state: 'visible' });
  await page.click('button:has-text("Export")');

  try {
    // Wait for the lirius option to appear and click it
    // Intercept the download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.click('text=Export as .LIRIUS')
    ]);

    // Save download to verify its contents
    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath, 'utf-8');
    console.log('Exported content:\n', content);

    // Get back to dashboard
    await page.evaluate(() => {
      const state = JSON.parse(window.localStorage.getItem('lirius-storage')).state;
      state.activeProjectId = null;
      window.localStorage.setItem('lirius-storage', JSON.stringify({state}));
    });
    await page.reload();

    // We should be back on dashboard
    await page.waitForSelector('text=Your Projects');
    await page.click('text=Delete'); // Deletes the project

    // Click create new project again
    await page.click('text=Create New Project');

    // The LIRIUS import uses an input[id="lirius-upload"]
    await page.setInputFiles('input[id="lirius-upload"]', downloadPath);

    // Wait a moment for import and UI switch to Synchronizer
    await page.waitForTimeout(1000);

    // Verify if it switched back to the Synchronizer
    const heading = await page.locator('h1:has-text("Test Lirius Export")').textContent();
    console.log("Post import active project heading visible:", heading);

    // Assert heading matches imported name
    if (heading.trim() !== 'Test Lirius Export') {
      throw new Error(`Heading didn't match. Got: ${heading}`);
    }
  } catch(e) {
    console.error(e);
    await page.screenshot({ path: 'export_fail2.png' });
    process.exit(1);
  }

  await browser.close();
  process.exit(0);
})();

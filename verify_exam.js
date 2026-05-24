const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the generated HTML file
  const filePath = 'file://' + path.resolve('PROVA_INTERATIVA.html');
  await page.goto(filePath);

  // Check if title exists
  const title = await page.textContent('h1');
  console.log('Title:', title);

  // Click "Iniciar Simulado" if it exists
  const startBtn = await page.$('button:has-text("Iniciar")');
  if (startBtn) {
      console.log('Clicking start button');
      await startBtn.click();
  }

  // Answer a few questions
  for (let i = 0; i < 3; i++) {
    console.log(`Answering question ${i+1}`);
    const options = await page.$$('button.w-full.p-4');
    if (options.length > 0) {
      await options[0].click();
      const nextBtn = await page.$('button:has-text("Próxima")');
      if (nextBtn) {
          await nextBtn.click();
      } else {
          console.log('Next button not found');
      }
      await new Promise(r => setTimeout(r, 500));
    } else {
        console.log('Options not found');
    }
  }

  await page.screenshot({ path: 'verification.png', fullPage: true });

  await browser.close();
  console.log('Verification screenshot saved as verification.png');
})();

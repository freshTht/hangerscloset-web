import { chromium } from '/Users/fresh/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

async function capture() {
  const browser = await chromium.launch();

  // 1. Mobile (390 x 844)
  console.log('Capturing mobile (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${baseUrl}/login`);
  await mobilePage.click('button:has-text("เข้าสู่ระบบด้วย Google")');
  await mobilePage.waitForTimeout(600);
  await mobilePage.goto(`${baseUrl}/bookings`);
  await mobilePage.waitForTimeout(600);

  // Open booking sheet
  await mobilePage.locator('button[aria-label="สร้างการจองใหม่"]:visible').click();
  await mobilePage.waitForSelector('#booking-sheet[open]');
  await mobilePage.waitForTimeout(500);

  // Capture Mobile Step 1
  await mobilePage.screenshot({ path: '/tmp/mobile_wizard_step_1.png' });
  console.log('Saved /tmp/mobile_wizard_step_1.png');

  // Select outfit AVL01
  await mobilePage.locator('button[aria-label="เลือกชุด AVL01"]').click();
  await mobilePage.waitForTimeout(300);

  // Advance to Step 2
  await mobilePage.locator('[data-testid="wizard-next-step-1"]').click();
  await mobilePage.waitForTimeout(500);

  // Capture Mobile Step 2
  await mobilePage.screenshot({ path: '/tmp/mobile_wizard_step_2.png' });
  console.log('Saved /tmp/mobile_wizard_step_2.png');

  // Select customer
  await mobilePage.locator('#customer-search-input').click();
  await mobilePage.waitForTimeout(300);
  await mobilePage.locator('button:has-text("คุณพลอย")').first().click();
  await mobilePage.waitForTimeout(300);

  // Advance to Step 3
  await mobilePage.locator('[data-testid="wizard-next-step-2"]').click();
  await mobilePage.waitForTimeout(500);

  // Capture Mobile Step 3
  await mobilePage.screenshot({ path: '/tmp/mobile_wizard_step_3.png' });
  console.log('Saved /tmp/mobile_wizard_step_3.png');

  await mobileContext.close();

  // 2. Desktop (1280 x 800)
  console.log('Capturing desktop (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`${baseUrl}/login`);
  await desktopPage.click('button:has-text("เข้าสู่ระบบด้วย Google")');
  await desktopPage.waitForTimeout(600);
  await desktopPage.goto(`${baseUrl}/bookings`);
  await desktopPage.waitForTimeout(600);

  // Open booking sheet
  await desktopPage.locator('button[aria-label="สร้างการจองใหม่"]:visible').click();
  await desktopPage.waitForSelector('#booking-sheet[open]');
  await desktopPage.waitForTimeout(500);

  // Capture Desktop Step 1
  await desktopPage.screenshot({ path: '/tmp/desktop_wizard_step_1.png' });
  console.log('Saved /tmp/desktop_wizard_step_1.png');

  // Select outfit AVL01
  await desktopPage.locator('button[aria-label="เลือกชุด AVL01"]').click();
  await desktopPage.waitForTimeout(300);

  // Advance to Step 2
  await desktopPage.locator('[data-testid="wizard-next-step-1"]').click();
  await desktopPage.waitForTimeout(500);

  // Capture Desktop Step 2
  await desktopPage.screenshot({ path: '/tmp/desktop_wizard_step_2.png' });
  console.log('Saved /tmp/desktop_wizard_step_2.png');

  // Select customer
  await desktopPage.locator('#customer-search-input').click();
  await desktopPage.waitForTimeout(300);
  await desktopPage.locator('button:has-text("คุณพลอย")').first().click();
  await desktopPage.waitForTimeout(300);

  // Advance to Step 3
  await desktopPage.locator('[data-testid="wizard-next-step-2"]').click();
  await desktopPage.waitForTimeout(500);

  // Capture Desktop Step 3
  await desktopPage.screenshot({ path: '/tmp/desktop_wizard_step_3.png' });
  console.log('Saved /tmp/desktop_wizard_step_3.png');

  await desktopContext.close();
  await browser.close();
  console.log('ALL 6 SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});

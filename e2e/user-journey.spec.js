const { test, expect } = require('@playwright/test');

// Generate a random email so tests don't conflict
const uniqueEmail = `testuser_${Date.now()}@example.com`;

test('Full User Journey: Signup -> Create Subject -> Add Card', async ({ page }) => {
  
  // --- 1. SIGN UP FLOW ---
  // FIXED: Use relative path. Playwright config will add the base URL automatically.
  await page.goto('/login');
  
  // Click "Create account" to switch modes
  await page.getByText(/create account/i).click(); 
  
  // Wait for the "Create Account" header to confirm we are on the right page
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

  // Fill ONLY Email and Password
  // Using comma for OR logic to find the input reliably
  await page.locator('input[type="email"], input[placeholder*="you@example.com"]').fill(uniqueEmail);
  await page.locator('input[type="password"]').fill('password123');
  
  // Click the "Create Account" submit button
  await page.getByRole('button', { name: /sign up|register|create account/i }).click();

  // Verify Dashboard Load
  // Wait for URL to switch to /dashboard
  await expect(page).toHaveURL(/.*dashboard/); 
  // Specific check to avoid strict mode errors
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();


  // --- 2. CREATE A SUBJECT ---
  // Click "New Sub"
  await page.click('text=New Sub'); 
  
  const subjectName = `E2E Subject ${Date.now()}`;
  
  // Fill the Subject Title (first text input in the modal)
  await page.locator('input[type="text"]').first().fill(subjectName);
  
  // Click Save/Confirm in Modal
  // Using .last() to target the button inside the modal and { force: true } to bypass overlays
  await page.getByRole('button', { name: /save|create|confirm/i }).last().click({ force: true });

  // Verify Subject Appears on Dashboard
  await expect(page.locator(`text=${subjectName}`)).toBeVisible();


  // --- 3. ADD A CARD MANUALLY ---
  await page.click('text=Add Card'); 
  
  // Select the Subject we just created
  await page.selectOption('select', { label: subjectName });

  // Create a Topic
  await page.click('button[title="Create New Topic"]');
  await page.fill('input[placeholder*="React"]', 'E2E Topic'); 
  
  // Save Topic
  await page.getByRole('button', { name: /save|create/i }).last().click({ force: true });

  // Fill out the Card
  await page.fill('#frontInput', 'Does Playwright work?');
  await page.fill('#backInput', 'Yes, it works beautifully.');
  
  // Save Card
  await page.click('text=Save Card', { force: true });

  // Verify Toast Success
  await expect(page.getByText(/success|saved|created/i).first()).toBeVisible({ timeout: 10000 });


  // --- 4. VERIFY ON DASHBOARD ---
  // FIXED: Use relative path
  await page.goto('/dashboard');
  
  // The subject should still be there
  await expect(page.locator(`text=${subjectName}`)).toBeVisible();
});
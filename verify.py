from playwright.sync_api import sync_playwright

def test_lirius(page):
    page.goto("http://localhost:5173")

    # We should see the Dashboard with Lirius header
    page.wait_for_selector("text=Lirius")

    # Click Create New Project
    page.click("text=Create New Project")

    # Wait for Modal to open
    page.wait_for_selector("text=Project Name (Track Title)")

    # Fill in Project details
    page.fill("input[id='projectName']", "Test Track")

    # Fill in Lyrics
    page.fill("textarea[id='lyrics']", "Line 1\n#INSTRUMENTAL\nLine 3")

    # Submit project
    page.click("button:has-text('Create Project')")

    # Wait for it to be created and appear on Dashboard
    page.wait_for_selector("text=Test Track")

    # Click on the newly created project to enter synchronizer view
    page.click("text=Test Track")

    # Wait for the synchronizer view to load
    page.wait_for_selector("text=Load Audio File")

    # Take a screenshot
    page.screenshot(path="verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    test_lirius(page)
    browser.close()

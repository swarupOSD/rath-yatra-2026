const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const jsErrors = [];
  const fileErrors = [];
  
  page.on("console", msg => {
    const text = msg.text();
    if (!text.includes("Failed to load resource") && !text.includes("AudioContext")) {
      console.log("PAGE LOG:", text);
    }
  });
  page.on("pageerror", error => {
    console.log("🔴 JS ERROR:", error.message);
    jsErrors.push(error.message);
  });
  page.on("requestfailed", request => {
    const url = request.url();
    // Only show non-image/audio failures
    if (!url.match(/\.(mp3|png|webp|svg|jpg|ico)$/)) {
      console.log("⚠️ REQ FAIL:", url, request.failure().errorText);
    } else {
      fileErrors.push(url.split('/').pop());
    }
  });
  
  await page.goto("file:///C:/Users/USER/OneDrive/Desktop/rath%20yatra/index.html", { waitUntil: 'networkidle0', timeout: 15000 });
  
  // Check if main elements exist
  const bodyVisible = await page.evaluate(() => {
    return {
      bodyOverflow: document.body.style.overflow,
      heroExists: !!document.querySelector('#hero'),
      canvasExists: !!document.querySelector('#rath-canvas'),
      navExists: !!document.querySelector('.premium-nav'),
      sectionsCount: document.querySelectorAll('section').length,
      title: document.title,
    };
  });
  
  console.log("\n=== PAGE STATE ===");
  console.log(JSON.stringify(bodyVisible, null, 2));
  console.log("\n=== JS ERRORS:", jsErrors.length === 0 ? "NONE ✅" : jsErrors.join(", "));
  console.log("=== Missing assets:", fileErrors.length, "files (non-fatal)");
  
  await browser.close();
})();

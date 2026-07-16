const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Load the local file
    await page.goto(`file://${__dirname.replace(/\\/g, '/')}/index.html`, { waitUntil: 'networkidle0' });
    
    // Take a screenshot of the chariot
    const chariot = await page.$('.chariot-body');
    if (chariot) {
        await chariot.screenshot({ path: 'chariot_debug.png' });
        console.log('Screenshot saved to chariot_debug.png');
    } else {
        console.log('Chariot not found!');
    }
    
    await browser.close();
})();

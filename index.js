const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let browser;

// Initialize Puppeteer browser instance
async function initBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    }
}

// Generate PDF from URL
async function exportWebsiteAsPdf(url) {
    try {
        await initBrowser();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }); // 30-second timeout

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
        });

        await page.close();
        return pdfBuffer;
    } catch (error) {
        console.error('Error exporting website as PDF:', error.message);
        throw error;
    }
}

app.get('/', (req, res) => {
    res.send('PDF Generation Service is online!');
});

app.post('/pdf', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    try {
        const pdfBuffer = await exportWebsiteAsPdf(url);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="generated.pdf"',
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).send({ error: 'Failed to generate PDF' });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    if (browser) {
        await browser.close();
    }
    console.log('Server shutting down');
    process.exit();
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

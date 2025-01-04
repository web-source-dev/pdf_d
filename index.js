const express = require('express');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from a .env file
dotenv.config();

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;  // Default to port 3000 if not specified

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to launch Puppeteer browser with recommended configuration
async function launchBrowser() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: process.env.PUPPETEER_HEADLESS === 'true', // Use headless mode based on environment variable
    });
    return browser;
}

// Function to generate PDF from provided HTML content
async function generatePdfFromHtml(htmlContent) {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
}

// Function to generate PDF from plain text
async function exportTextAsPdf(text) {
    const htmlContent = `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 20px;
                    }
                </style>
            </head>
            <body>
                ${text.replace(/\n/g, '<br>')}
            </body>
        </html>
    `;
    return generatePdfFromHtml(htmlContent);
}

// Function to generate PDF from a URL
async function exportWebsiteAsPdf(url) {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
}

// Route to generate PDF
app.post('/pdf', async (req, res) => {
    const { url, text } = req.body;

    if (!url && !text) {
        return res.status(400).json({ error: 'Either URL or text is required' });
    }

    try {
        let pdfBuffer;

        // Generate PDF from URL or text
        if (url) {
            console.log(`Generating PDF for URL: ${url}`);
            pdfBuffer = await exportWebsiteAsPdf(url);
        } else if (text) {
            console.log('Generating PDF for text content');
            pdfBuffer = await exportTextAsPdf(text);
        }

        // Send the generated PDF as a response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="generated.pdf"',
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error.message || error.stack);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Serve a simple message on the root route
app.get('/', (req, res) => {
    res.send('Welcome to the PDF Generator Service!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const puppeteer = require('puppeteer');

require('dotenv').config();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to generate a PDF from plain text
async function exportTextAsPdf(text) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Generate a simple HTML structure with the provided text
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

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
}

app.post('/pdf', async (req, res) => {
    const { url, text } = req.body;

    if (!url && !text) {
        return res.status(400).send({ error: 'Either URL or text is required' });
    }

    try {
        let pdfBuffer;

        if (url) {
            console.log(`Generating PDF for URL: ${url}`);
            pdfBuffer = await exportWebsiteAsPdf(url);
        } else if (text) {
            console.log(`Generating PDF for text content`);
            pdfBuffer = await exportTextAsPdf(text);
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="generated.pdf"',
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error.stack);
        res.status(500).send({ error: 'Failed to generate PDF' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

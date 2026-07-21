const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const htmlFileName = process.argv[2];
const outputPdfName = process.argv[3];

if (!htmlFileName || !outputPdfName) {
    console.error('Usage: node generate_notes_pdf.js <input.html> <output.pdf>');
    process.exit(1);
}

(async () => {
    try {
        console.log('Launching headless Chrome...');
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        const htmlPath = 'file://' + path.resolve(htmlFileName);
        console.log('Loading HTML file:', htmlPath);
        await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait a bit for fonts to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        const coverPath = path.resolve(__dirname, 'cover_temp.pdf');
        const contentPath = path.resolve(__dirname, 'content_temp.pdf');
        const finalPdfPath = path.resolve(outputPdfName);

        console.log('Generating cover page...');
        await page.pdf({
            path: coverPath,
            format: 'A4',
            pageRanges: '1',
            printBackground: true,
            displayHeaderFooter: false,
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
        });

        console.log('Generating content pages...');
        await page.pdf({
            path: contentPath,
            format: 'A4',
            pageRanges: '2-',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 7px; font-family: 'Outfit', 'Helvetica', sans-serif; font-weight: 600; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; box-sizing: border-box;">
                    <span>📐 MATHS FOR ML — DESCRIPTIVE STATISTICS PART 1</span>
                    <span>CAMPUSX · SESSION 38</span>
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 7px; font-family: 'Helvetica', sans-serif; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; box-sizing: border-box;">
                    <span>Complete Session Notes · Mathematics for Machine Learning</span>
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>
            `,
            margin: { top: '20mm', bottom: '20mm', left: '0px', right: '0px' }
        });

        await browser.close();

        // Check if pdfunite is available for merging
        const { execSync } = require('child_process');
        try {
            console.log('Merging cover and content PDFs...');
            execSync(`pdfunite "${coverPath}" "${contentPath}" "${finalPdfPath}"`);
            
            // Clean up temp files
            fs.unlinkSync(coverPath);
            fs.unlinkSync(contentPath);
            console.log('✅ PDF successfully generated:', finalPdfPath);
        } catch (mergeErr) {
            // If pdfunite not available, just use the content pdf
            console.log('pdfunite not available, generating single PDF...');
            
            // Re-generate as single PDF
            const page2 = await (await puppeteer.launch({
                executablePath: '/usr/bin/google-chrome',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            })).newPage();
            
            await page2.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page2.pdf({
                path: finalPdfPath,
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: false,
                margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
            });
            
            // Clean up temp files if they exist
            try { fs.unlinkSync(coverPath); } catch(e) {}
            try { fs.unlinkSync(contentPath); } catch(e) {}
            
            console.log('✅ PDF successfully generated (single file):', finalPdfPath);
        }
    } catch (err) {
        console.error('Error during PDF generation:', err);
        process.exit(1);
    }
})();

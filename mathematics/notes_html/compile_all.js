const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const htmlDir = '/home/kirtagya/Desktop/mission-ml/mathematics/notes_html';
const outputDir = '/home/kirtagya/Desktop/mission-ml/mathematics';

const jobs = [
    {
        html: 'session_43_central_limit_theorem.html',
        pdf: 'Session_43_Central_Limit_Theorem.pdf',
        header: '📐 MATHS FOR ML — CENTRAL LIMIT THEOREM',
        subheader: 'CAMPUSX · SESSION 43'
    },
    {
        html: 'session_44_confidence_intervals.html',
        pdf: 'Session_44_Confidence_Intervals.pdf',
        header: '📐 MATHS FOR ML — CONFIDENCE INTERVALS',
        subheader: 'CAMPUSX · SESSION 44'
    },
    {
        html: 'session_45_hypothesis_testing_part1.html',
        pdf: 'Session_45_Hypothesis_Testing_Part1.pdf',
        header: '📐 MATHS FOR ML — HYPOTHESIS TESTING PART 1',
        subheader: 'CAMPUSX · SESSION 45'
    },
    {
        html: 'session_46_hypothesis_testing_part2.html',
        pdf: 'Session_46_Hypothesis_Testing_Part2.pdf',
        header: '📐 MATHS FOR ML — HYPOTHESIS TESTING PART 2',
        subheader: 'CAMPUSX · SESSION 46'
    },
    {
        html: 'session_chi_square_tests.html',
        pdf: 'Session_47_Chi_Square_Tests.pdf',
        header: '📐 MATHS FOR ML — CHI-SQUARE TESTS',
        subheader: 'CAMPUSX · SESSION 47'
    },
    {
        html: 'session_anova.html',
        pdf: 'Session_48_ANOVA.pdf',
        header: '📐 MATHS FOR ML — ANALYSIS OF VARIANCE (ANOVA)',
        subheader: 'CAMPUSX · SESSION 48'
    },
    {
        html: 'session_probability_part1.html',
        pdf: 'Session_49_Probability_Part1.pdf',
        header: '📐 MATHS FOR ML — FOUNDATIONS OF PROBABILITY',
        subheader: 'CAMPUSX · SESSION 49'
    },
    {
        html: 'session_probability_part2.html',
        pdf: 'Session_50_Probability_Part2.pdf',
        header: '📐 MATHS FOR ML — CONDITIONAL PROBABILITY',
        subheader: 'CAMPUSX · SESSION 50'
    },
    {
        html: 'session_linear_algebra_roadmap.html',
        pdf: 'Session_51_Linear_Algebra_Roadmap.pdf',
        header: '📐 MATHS FOR ML — LINEAR ALGEBRA ROADMAP',
        subheader: 'CAMPUSX · SESSION 51'
    },
    {
        html: 'session_vectors.html',
        pdf: 'Session_52_Vectors.pdf',
        header: '📐 MATHS FOR ML — VECTOR SPACES',
        subheader: 'CAMPUSX · SESSION 52'
    },
    {
        html: 'session_matrices_part1.html',
        pdf: 'Session_53_Matrices_Part1.pdf',
        header: '📐 MATHS FOR ML — MATRICES & TRANSFORMATIONS',
        subheader: 'CAMPUSX · SESSION 53'
    },
    {
        html: 'session_matrices_part2.html',
        pdf: 'Session_54_Matrices_Part2.pdf',
        header: '📐 MATHS FOR ML — SYSTEMS & RANK',
        subheader: 'CAMPUSX · SESSION 54'
    },
    {
        html: 'session_eigenvalues.html',
        pdf: 'Session_55_Eigenvalues.pdf',
        header: '📐 MATHS FOR ML — EIGENVALUES & EIGENVECTORS',
        subheader: 'CAMPUSX · SESSION 55'
    },
    {
        html: 'session_eigen_decomposition_pca.html',
        pdf: 'Session_56_Eigen_Decomposition_PCA.pdf',
        header: '📐 MATHS FOR ML — PCA',
        subheader: 'CAMPUSX · SESSION 56'
    },
    {
        html: 'session_singular_value_decomposition.html',
        pdf: 'Session_57_Singular_Value_Decomposition.pdf',
        header: '📐 MATHS FOR ML — SVD',
        subheader: 'CAMPUSX · SESSION 57'
    },
    {
        html: 'session_optimization.html',
        pdf: 'Session_58_Optimization.pdf',
        header: '📐 MATHS FOR ML — MATHEMATICAL OPTIMIZATION',
        subheader: 'CAMPUSX · SESSION 58'
    },
    {
        html: 'session_differential_calculus.html',
        pdf: 'Session_59_Differential_Calculus.pdf',
        header: '📐 MATHS FOR ML — DIFFERENTIAL CALCULUS',
        subheader: 'CAMPUSX · SESSION 59'
    }
];

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        console.log(`Processing [${i + 1}/${jobs.length}]: ${job.html}...`);
        
        try {
            const htmlPath = 'file://' + path.join(htmlDir, job.html);
            await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1500));

            const coverPath = path.join(htmlDir, 'cover_temp.pdf');
            const contentPath = path.join(htmlDir, 'content_temp.pdf');
            const finalPdf = path.join(outputDir, job.pdf);

            await page.pdf({
                path: coverPath,
                format: 'A4',
                pageRanges: '1',
                printBackground: true,
                displayHeaderFooter: false,
                margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
            });

            await page.pdf({
                path: contentPath,
                format: 'A4',
                pageRanges: '2-',
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-size: 7px; font-family: 'Outfit', 'Helvetica', sans-serif; font-weight: 600; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; box-sizing: border-box;">
                        <span>${job.header}</span>
                        <span>${job.subheader}</span>
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

            execSync(`pdfunite "${coverPath}" "${contentPath}" "${finalPdf}"`);
            fs.unlinkSync(coverPath);
            fs.unlinkSync(contentPath);
            console.log(`✅ Success: ${job.pdf}`);
        } catch (e) {
            console.error(`❌ Error processing ${job.html}:`, e);
        }
    }

    await browser.close();
    console.log('Finished rendering all PDFs!');
})();

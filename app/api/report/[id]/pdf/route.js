import puppeteer from 'puppeteer';
import { getReport } from '../../../../lib/db';
import { handleDownloadReportPdfRequest } from '../../../../lib/api/report-pdf-handler.mjs';

async function renderPdf(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return Buffer.from(await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '16mm',
        right: '12mm',
        bottom: '16mm',
        left: '12mm',
      },
    }));
  } finally {
    await browser.close();
  }
}

export async function GET(request, context) {
  return handleDownloadReportPdfRequest(request, context, {
    getReport,
    renderPdf,
  });
}

import { v4 as uuidv4 } from 'uuid';
import { createReport, updateReportContent } from '../../lib/db';
import { generateReport } from '../../lib/ai';
import { handleGenerateReportRequest } from '../../lib/api/generate-handler.mjs';

export async function POST(request) {
  return handleGenerateReportRequest(request, {
    createId: uuidv4,
    createReport,
    updateReportContent,
    generateReport,
  });
}

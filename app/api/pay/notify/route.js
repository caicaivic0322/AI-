import { markReportPaid } from '../../../lib/db';
import { handlePayNotifyRequest } from '../../../lib/api/pay-notify-handler.mjs';

const XUNHU_APPSECRET = process.env.XUNHU_APPSECRET || '';

export async function POST(request) {
  return handlePayNotifyRequest(request, {
    secret: XUNHU_APPSECRET,
    markReportPaid,
  });
}

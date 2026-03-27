import { getReport } from '../../../lib/db';
import { handlePayCreateRequest } from '../../../lib/api/pay-create-handler.mjs';

const XUNHU_APPID = process.env.XUNHU_APPID || '';
const XUNHU_APPSECRET = process.env.XUNHU_APPSECRET || '';

export async function POST(request) {
  return handlePayCreateRequest(request, {
    appId: XUNHU_APPID,
    secret: XUNHU_APPSECRET,
    getReport,
  });
}

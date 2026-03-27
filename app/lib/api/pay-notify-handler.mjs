import crypto from 'crypto';
import { jsonResponse } from './response-utils.mjs';

function verifySign(params, secret) {
  const receivedHash = params.hash;
  const sorted = Object.keys(params)
    .filter((key) => key !== 'hash' && params[key] !== '' && params[key] !== undefined)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const expectedHash = crypto
    .createHash('md5')
    .update(sorted + secret)
    .digest('hex');

  return receivedHash === expectedHash;
}

async function readRequestParams(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function handlePayNotifyRequest(request, dependencies) {
  const { secret, markReportPaid } = dependencies;

  try {
    const params = await readRequestParams(request);

    if (!secret && params.reportId) {
      markReportPaid(params.reportId, `DEV_ORDER_${Date.now()}`);
      return jsonResponse({ success: true });
    }

    if (secret && !verifySign(params, secret)) {
      console.error('Invalid payment notification signature');
      return new Response('fail', { status: 400 });
    }

    if (params.status === 'OD' || params.trade_status === 'TRADE_SUCCESS') {
      const reportId = params.attach;
      const orderNo = params.trade_order_id;

      if (reportId) {
        markReportPaid(reportId, orderNo);
        console.log(`Report ${reportId} marked as paid, order: ${orderNo}`);
      }
    }

    return new Response('success');
  } catch (error) {
    console.error('Pay notify error:', error);
    return new Response('fail', { status: 500 });
  }
}

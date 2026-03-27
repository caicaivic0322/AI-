import crypto from 'crypto';
import { jsonResponse } from './response-utils.mjs';

const XUNHU_API_URL = 'https://api.xunhupay.com/payment/do.html';

function generateSign(params, secret) {
  const sorted = Object.keys(params)
    .filter((key) => key !== 'hash' && params[key] !== '' && params[key] !== undefined)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('md5')
    .update(sorted + secret)
    .digest('hex');
}

export async function handlePayCreateRequest(request, dependencies) {
  const {
    appId = '',
    secret = '',
    getReport,
    fetchImpl = fetch,
    now = Date.now,
    createNonce = () => crypto.randomBytes(16).toString('hex'),
  } = dependencies;

  try {
    const { reportId, payType } = await request.json();

    if (!reportId) {
      return jsonResponse({ error: '缺少报告ID' }, { status: 400 });
    }

    const report = getReport(reportId);
    if (!report) {
      return jsonResponse({ error: '报告不存在' }, { status: 404 });
    }

    if (report.paid) {
      return jsonResponse({ error: '已支付' }, { status: 400 });
    }

    if (!appId || !secret) {
      return jsonResponse({
        success: true,
        dev_mode: true,
        message: '开发模式：请调用 /api/pay/notify 模拟支付成功',
        reportId,
      });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const orderNo = `GK${now()}`;

    const params = {
      version: '1.1',
      appid: appId,
      trade_order_id: orderNo,
      total_fee: (report.amount / 100).toFixed(2),
      title: '高考志愿AI分析报告',
      time: Math.floor(now() / 1000).toString(),
      notify_url: `${baseUrl}/api/pay/notify`,
      return_url: `${baseUrl}/report/${reportId}`,
      nonce_str: createNonce(),
      type: payType === 'alipay' ? 'alipay' : 'wechat',
      attach: reportId,
    };

    params.hash = generateSign(params, secret);

    const response = await fetchImpl(XUNHU_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (data.errcode !== 0) {
      console.error('XunhuPay error:', data);
      return jsonResponse({ error: data.errmsg || '创建订单失败' }, { status: 500 });
    }

    return jsonResponse({
      success: true,
      payUrl: data.url_qrcode || data.url,
      orderNo,
    });
  } catch (error) {
    console.error('Pay create error:', error);
    return jsonResponse({ error: '创建支付订单失败' }, { status: 500 });
  }
}
